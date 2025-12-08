import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { logger } from '@/utils/logger';
import { cacheGet, cacheSet, cacheDelPattern } from '@/utils/redis';

/**
 * List published articles with pagination and caching (public endpoint)
 * Only returns PUBLISHED articles for public consumption
 */
export async function listArticles(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Try to get from cache
    const cacheKey = `articles:page:${page}:limit:${limit}`;
    const cached = await cacheGet<any>(cacheKey);

    if (cached) {
      logger.info(`Cache hit for ${cacheKey}`);
      return res.json(cached);
    }

    // If not in cache, fetch from database
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
        },
        include: {
          tags: { include: { tag: true } },
          author: {
            select: {
              id: true,
              walletAddress: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({
        where: {
          status: 'PUBLISHED',
        },
      }),
    ]);

    const response = {
      articles,
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
 * Get articles by wallet address
 * Returns all articles (including drafts) if walletAddress matches author
 * Supports pagination with page and limit query params
 */
export async function getArticlesByWallet(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          authorId: user.id,
        },
        include: {
          tags: { include: { tag: true } },
          author: {
            select: {
              id: true,
              walletAddress: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({
        where: {
          authorId: user.id,
        },
      }),
    ]);

    return res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    logger.error(`getArticlesByWallet: ${(error as Error).message}`);
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                walletAddress: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Only allow access to draft articles if explicitly needed
    // Frontend should handle this by checking wallet address
    return res.json(article);
  } catch (error) {
    logger.error(`getArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch article' });
  }
}

export async function createArticle(req: Request, res: Response) {
  const {
    title,
    slug,
    description,
    content,
    category,
    tagIds = [],
    authorId,
    status,
    featured,
    publishedAt,
  } = req.body;

  try {
    const created = await prisma.article.create({
      data: {
        title,
        slug,
        description,
        content,
        category,
        authorId,
        status,
        featured,
        publishedAt,
        tags: {
          create: tagIds.map((tagId: string) => ({ tagId })),
        },
      },
      include: {
        tags: { include: { tag: true } },
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

    return res.status(201).json(created);
  } catch (error) {
    logger.error(`createArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to create article' });
  }
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const { tagIds, ...rest } = req.body;

  try {
    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...rest,
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId: string) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        tags: { include: { tag: true } },
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

    return res.json(updated);
  } catch (error) {
    logger.error(`updateArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update article' });
  }
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.article.delete({ where: { id } });

    // Invalidate article list cache
    await cacheDelPattern('articles:page:*');

    return res.status(204).send();
  } catch (error) {
    logger.error(`deleteArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to delete article' });
  }
}
