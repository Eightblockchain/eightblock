import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../utils/redis.js';
import { getFullImageUrl } from '../utils/imgUrl.js';
import {
  categoryFilter,
  publishedTopics,
  topicFilter,
  topicSlug as toTagSlug,
} from '../utils/topics.js';
import { articleCategories } from '../utils/categories.js';
import { draftArticleNewsletter } from '../services/newsletter-automation.js';
import { VISIBLE_COMMENTS } from '../utils/comments.js';

const ARTICLE_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED'] as const;

function queueNewsletterDraft(articleId: string) {
  void draftArticleNewsletter(articleId).catch((error) =>
    logger.error(`Newsletter draft for article ${articleId} failed: ${(error as Error).message}`)
  );
}

/** Optional ?author= (username), ?tag= and ?category= filters shared by the public list endpoints. */
function listFilters(req: Request) {
  const author =
    typeof req.query.author === 'string' ? req.query.author.trim().toLowerCase().slice(0, 30) : '';
  const tag = typeof req.query.tag === 'string' ? toTagSlug(req.query.tag.slice(0, 60)) : '';
  const category =
    typeof req.query.category === 'string' ? toTagSlug(req.query.category.slice(0, 60)) : '';
  return { author, tag, category };
}

const PUBLISH_NEEDS_CATEGORY = 'Pick at least one category before publishing.';

/** Checks the ids exist and keeps the author's order. Null when one of them is unknown. */
async function resolveCategories(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  const found = await prisma.category.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  return found.length === unique.length ? unique : null;
}

/**
 * Tags are identified by slug, so "Cardano" and "cardano" resolve to the same tag
 * (reusing the existing spelling) instead of colliding on the unique slug.
 */
async function resolveTags(names: string[]) {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = toTagSlug(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name.trim());
  }

  const tags = [];
  for (const [slug, name] of bySlug) {
    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      tags.push(existing);
      continue;
    }
    try {
      tags.push(await prisma.tag.create({ data: { name, slug } }));
    } catch (error) {
      // Lost a race with a concurrent request creating the same tag.
      if ((error as { code?: string }).code !== 'P2002') throw error;
      const created = await prisma.tag.findFirst({ where: { OR: [{ slug }, { name }] } });
      if (!created) throw error;
      tags.push(created);
    }
  }
  return [...new Map(tags.map((tag) => [tag.id, tag])).values()];
}

/**
 * List published articles with pagination and caching (public endpoint)
 * Only returns PUBLISHED articles for public consumption
 */
export async function listArticles(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'latest' ? 'latest' : 'score';
    const { author, tag, category } = listFilters(req);

    // Try to get from cache
    const cacheKey = `articles:page:${page}:limit:${limit}:sort:${sort}:author:${author}:tag:${tag}:category:${category}`;
    const cached = await cacheGet<unknown>(cacheKey);

    if (cached) {
      logger.info(`Cache hit for ${cacheKey}`);
      return res.json(cached);
    }

    const where = {
      status: 'PUBLISHED' as const,
      ...(author && { author: { username: author } }),
      ...(tag && topicFilter(tag)),
      ...(category && categoryFilter(category)),
    };

    // If not in cache, fetch from database
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          content: true,
          featuredImage: true,
          status: true,
          featured: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          viewCount: true,
          uniqueViews: true,
          tags: { include: { tag: true } },
          categories: articleCategories,
          author: {
            select: {
              id: true,
              walletAddress: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: { select: { likes: true, comments: { where: VISIBLE_COMMENTS } } },
        },
        orderBy:
          sort === 'latest'
            ? [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
            : [{ score: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    // Format author avatar URLs
    const articlesWithFormattedAvatars = articles.map((article) => {
      return {
        ...article,
        author: {
          ...article.author,
          avatarUrl: getFullImageUrl(article.author.avatarUrl || ''),
        },
      };
    });

    const response = {
      articles: articlesWithFormattedAvatars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, response, 300);
    logger.info(`Cache set for ${cacheKey}`);

    return res.json(response);
  } catch (error) {
    logger.error(`listArticles: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch articles' });
  }
}

/**
 * Topics of published articles with counts, optionally for one author (?author=username).
 */
export async function listTopics(req: Request, res: Response) {
  const { author } = listFilters(req);
  const cacheKey = `articles:page:topics:author:${author}`;
  try {
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return res.json(cached);

    const topics = await publishedTopics(author ? { author: { username: author } } : {});
    await cacheSet(cacheKey, topics, 300);
    return res.json(topics);
  } catch (error) {
    logger.error(`listTopics: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }
}

/**
 * Get the signed-in author's articles, including drafts.
 * Query: page, limit (max 50), status (DRAFT | REVIEW | PUBLISHED).
 */
export async function getMyArticles(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;
  const status = ARTICLE_STATUSES.find((s) => s === req.query.status);
  const where = { authorId: userId, ...(status && { status }) };

  try {
    const [articles, total, byStatus] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          featuredImage: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          viewCount: true,
          tags: { select: { tag: { select: { id: true, name: true } } } },
          categories: articleCategories,
          _count: { select: { likes: true, comments: { where: VISIBLE_COMMENTS } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
      prisma.article.groupBy({ by: ['status'], where: { authorId: userId }, _count: true }),
    ]);

    const counts = { ALL: 0, DRAFT: 0, REVIEW: 0, PUBLISHED: 0 };
    for (const row of byStatus) {
      counts[row.status] = row._count;
      counts.ALL += row._count;
    }

    return res.json({
      articles,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    logger.error(`getMyArticles: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch user articles' });
  }
}

/**
 * Get single article by slug
 */
export async function getArticle(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        tags: { include: { tag: true } },
        categories: articleCategories,
        author: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        _count: { select: { likes: true, comments: { where: VISIBLE_COMMENTS } } },
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'PUBLISHED' && article.authorId !== req.user?.userId) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Format author avatar URLs
    article.author.avatarUrl = getFullImageUrl(article.author.avatarUrl || '');

    return res.json(article);
  } catch (error) {
    logger.error(`getArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch article' });
  }
}

export async function createArticle(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const {
    title,
    slug,
    excerpt,
    content,
    tags = [],
    categoryIds = [],
    featuredImage,
    status = 'DRAFT',
  } = req.body;

  try {
    const categories = await resolveCategories(categoryIds);
    if (!categories) {
      return res.status(400).json({ error: 'One of the categories no longer exists.' });
    }
    if (status === 'PUBLISHED' && !categories.length) {
      return res.status(400).json({ error: PUBLISH_NEEDS_CATEGORY });
    }

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return res.status(400).json({
        error: 'An article with this URL already exists. Change the title to get a different one.',
      });
    }

    const tagRecords = await resolveTags(tags);

    const created = await prisma.article.create({
      data: {
        title,
        slug,
        description: excerpt || '', // Map excerpt to description
        content,
        featuredImage: featuredImage || undefined,
        status,
        // publishedAt will use default value from schema (@default(now()))
        author: {
          connect: { id: userId },
        },
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
        categories: {
          create: categories.map((categoryId, position) => ({ categoryId, position })),
        },
      },
      include: {
        tags: { include: { tag: true } },
        categories: articleCategories,
        author: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Invalidate article list cache
    await cacheDelPattern('articles:page:*');
    if (created.status === 'PUBLISHED') queueNewsletterDraft(created.id);

    // Format author avatar URLs
    created.author.avatarUrl = getFullImageUrl(created.author.avatarUrl || '');

    return res.status(201).json(created);
  } catch (error) {
    logger.error(`createArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to create article' });
  }
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { title, slug, excerpt, content, featuredImage, status } = req.body;
  const tags: string[] | undefined = req.body.tags;
  const categoryIds: string[] | undefined = req.body.categoryIds;

  try {
    // Check if article exists and user is the author
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { author: true, categories: { select: { categoryId: true } } },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.author.id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own articles' });
    }

    if (slug && slug !== existingArticle.slug) {
      const taken = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
      if (taken) {
        return res.status(409).json({
          error: 'Another article already uses this URL. Change the title to get a different one.',
        });
      }
    }

    // Tags and categories are replaced only when the request includes them, so partial updates keep them.
    const categories = categoryIds ? await resolveCategories(categoryIds) : undefined;
    if (categories === null) {
      return res.status(400).json({ error: 'One of the categories no longer exists.' });
    }
    const categoryCount = categories?.length ?? existingArticle.categories.length;
    if (status === 'PUBLISHED' && !categoryCount) {
      return res.status(400).json({ error: PUBLISH_NEEDS_CATEGORY });
    }
    const tagRecords = tags ? await resolveTags(tags) : null;
    // publishedAt defaults to the draft's creation time; readers should see the day it went live.
    const publishing = status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED';

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug,
        description: excerpt !== undefined ? excerpt : existingArticle.description,
        content,
        featuredImage: featuredImage !== undefined ? featuredImage : existingArticle.featuredImage,
        status,
        ...(publishing && { publishedAt: new Date() }),
        ...(tagRecords && {
          tags: {
            deleteMany: {},
            create: tagRecords.map((tag) => ({ tagId: tag.id })),
          },
        }),
        ...(categories && {
          categories: {
            deleteMany: {},
            create: categories.map((categoryId, position) => ({ categoryId, position })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
        categories: articleCategories,
        author: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Invalidate article list cache
    await cacheDelPattern('articles:page:*');
    if (publishing) queueNewsletterDraft(id);

    // Format author avatar URLs
    updated.author.avatarUrl = getFullImageUrl(updated.author.avatarUrl || '');

    return res.json(updated);
  } catch (error) {
    logger.error(`updateArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update article' });
  }
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    // Verify article exists and user owns it
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this article' });
    }

    // Delete all related records first to avoid foreign key constraint violations
    await prisma.$transaction([
      // Delete likes
      prisma.like.deleteMany({ where: { articleId: id } }),
      // Delete comments
      prisma.comment.deleteMany({ where: { articleId: id } }),
      prisma.bookmark.deleteMany({ where: { articleId: id } }),
      // Delete tag associations
      prisma.tagOnArticle.deleteMany({ where: { articleId: id } }),
      // Finally delete the article
      prisma.article.delete({ where: { id } }),
    ]);

    // Invalidate article list cache
    await cacheDelPattern('articles:page:*');

    return res.status(204).send();
  } catch (error) {
    logger.error(`deleteArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to delete article' });
  }
}

/**
 * Get related articles based on shared tags
 */
export async function getRelatedArticles(req: Request, res: Response) {
  const { slug } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 3, 6);

  try {
    // First, get the current article's tags
    const currentArticle = await prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    if (!currentArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const tagIds = currentArticle.tags.map((t) => t.tagId);

    if (tagIds.length === 0) {
      // If no tags, return recent published articles
      const recentArticles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: currentArticle.id },
        },
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              walletAddress: true,
              name: true,
              avatarUrl: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: articleCategories,
          _count: {
            select: {
              likes: true,
              comments: { where: VISIBLE_COMMENTS },
            },
          },
        },
      });

      return res.json(
        recentArticles.map((article) => ({
          ...article,
          author: {
            ...article.author,
            avatarUrl: getFullImageUrl(article.author.avatarUrl || ''),
          },
        }))
      );
    }

    // Find articles that share tags with the current article
    const relatedArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: currentArticle.id },
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      take: limit * 2, // Get more to sort by relevance
      include: {
        author: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: articleCategories,
        _count: {
          select: {
            likes: true,
            comments: { where: VISIBLE_COMMENTS },
          },
        },
      },
    });

    // Calculate relevance score based on shared tags
    const articlesWithScore = relatedArticles.map((article) => {
      const articleTagIds = article.tags.map((t) => t.tagId);
      const sharedTags = tagIds.filter((tagId) => articleTagIds.includes(tagId));
      return {
        ...article,
        relevanceScore: sharedTags.length,
      };
    });

    // Sort by relevance (most shared tags) then by likes
    articlesWithScore.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b._count.likes - a._count.likes;
    });

    // Take top N and format
    const topRelated = articlesWithScore.slice(0, limit).map((article) => {
      const { relevanceScore: _relevanceScore, ...articleData } = article;
      return {
        ...articleData,
        author: {
          ...articleData.author,
          avatarUrl: getFullImageUrl(articleData.author.avatarUrl || ''),
        },
      };
    });

    return res.json(topRelated);
  } catch (error) {
    logger.error(`getRelatedArticles: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch related articles' });
  }
}
