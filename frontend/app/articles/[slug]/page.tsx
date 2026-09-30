import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleHeader } from '@/components/articles/article-header';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleAuthor } from '@/components/articles/article-author';
import { ArticleClientWrapper } from '@/components/articles/article-client-wrapper';
import { RelatedArticles } from '@/components/articles/related-articles';
import { siteConfig } from '@/lib/site-config';
import { readingTime } from '@/lib/chain';
import { jsonLd as toJsonLd } from '@/lib/json-ld';
import { OG_SIZE, feedAlternates, ogImagePath } from '@/lib/page-metadata';
import { fetchSupportWallets } from '@/lib/support-wallets';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';

const authorUrl = (author?: { username?: string | null } | null) =>
  author?.username ? `${BASE_URL}/authors/${author.username}` : `${BASE_URL}/about`;

/**
 * Returns a publicly accessible absolute image URL, or null.
 * Rejects localhost/relative URLs so social bots (which can't reach localhost) don't get broken images.
 */
function sanitizeOgImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return null;
    return url;
  } catch {
    // relative path: not usable directly for OG
    return null;
  }
}

// Short, because on-demand revalidation only reaches the PM2 instance that handled the save.
export const revalidate = 60;

export async function generateStaticParams() {
  // Pre-generate only the 1,000 most-recently-published articles at build time.
  // Remaining slugs are rendered on-demand via ISR (Next.js dynamicParams = true default).
  const MAX_PREGENERATE = 1000;
  try {
    let slugs: { slug: string }[] = [];
    let page = 1;
    while (slugs.length < MAX_PREGENERATE) {
      const res = await fetch(`${API_URL}/articles?page=${page}&limit=100&status=PUBLISHED`);
      if (!res.ok) break;
      const data = await res.json();
      const articles = Array.isArray(data) ? data : (data.articles ?? []);
      if (articles.length === 0) break;
      slugs = slugs.concat(articles.map((a: { slug: string }) => ({ slug: a.slug })));
      if (!data.pagination || page >= data.pagination.totalPages) break;
      page++;
    }
    return slugs.slice(0, MAX_PREGENERATE);
  } catch {
    return [];
  }
}

/**
 * Null only when the article does not exist. Other failures throw, so a revalidation during an
 * API outage keeps serving the last good page instead of caching a 404.
 */
const fetchArticle = cache(async (slug: string) => {
  const response = await fetch(`${API_URL}/articles/${slug}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch article ${slug}: ${response.status}`);
  return response.json();
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const article = await fetchArticle(slug);
    if (!article) return {};

    const title = article.title;
    const rawDesc =
      article.description ||
      article.content
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 200) ||
      '';
    const description =
      rawDesc.length > 160 ? rawDesc.slice(0, rawDesc.lastIndexOf(' ', 160)) + '…' : rawDesc.trim();
    const url = `${BASE_URL}/articles/${slug}`;

    const tags: string[] = article.tags?.map((t: any) => t.tag.name) ?? [];
    const ogImageUrl =
      sanitizeOgImageUrl(article.featuredImage) ??
      ogImagePath({ title, description, eyebrow: article.category || 'Article', topics: tags });

    const ogImageEntry = { url: ogImageUrl, ...OG_SIZE, alt: title };

    return {
      title,
      description,
      keywords: tags.join(', '),
      authors: [{ name: article.author?.name || 'Anonymous' }],
      openGraph: {
        title,
        description,
        url,
        images: [ogImageEntry],
        type: 'article',
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt || article.publishedAt,
        authors: [authorUrl(article.author)],
        siteName: 'Eightblock',
      },
      twitter: {
        card: 'summary_large_image',
        site: siteConfig.twitterHandle,
        title,
        description,
        images: [ogImageUrl],
      },
      alternates: { canonical: url, ...feedAlternates },
      robots: {
        index: article.status === 'PUBLISHED',
        follow: article.status === 'PUBLISHED',
      },
    };
  } catch (e) {
    return {};
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, supportWallets] = await Promise.all([fetchArticle(slug), fetchSupportWallets()]);

  if (!article || article.status !== 'PUBLISHED') {
    // For SEO, return 404 if not published
    notFound();
  }

  const minutes = readingTime(article.content);

  // JSON-LD structured data
  const canonicalUrl = `${BASE_URL}/articles/${slug}`;
  const safeImage =
    sanitizeOgImageUrl(article.featuredImage) ??
    `${BASE_URL}${ogImagePath({ title: article.title, description: article.description || undefined, eyebrow: article.category || 'Article' })}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || '',
    image: safeImage,
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Anonymous',
      url: authorUrl(article.author),
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/apple-icon`,
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    keywords: article.tags?.map((t: any) => t.tag.name).join(', ') || '',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${BASE_URL}/writing` },
      { '@type': 'ListItem', position: 3, name: article.title },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLd(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLd(breadcrumbLd)} />

      <ArticleHeader
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          description: article.description,
          category: article.category,
          status: article.status,
          featured: article.featured,
          featuredImage: article.featuredImage,
          publishedAt: article.publishedAt,
          viewCount: article.viewCount,
          author: article.author
            ? { name: article.author.name, username: article.author.username }
            : null,
          tags: article.tags,
        }}
        readingTime={minutes}
        likesCount={article._count?.likes || 0}
        commentsCount={article._count?.comments || 0}
      />

      <ArticleContent content={article.content} />

      <ArticleClientWrapper
        articleId={article.id}
        articleSlug={slug}
        articleTitle={article.title}
        authorId={article.author?.id ?? null}
        initialLikesCount={article._count?.likes || 0}
        initialCommentsCount={article._count?.comments || 0}
        isPublished={article.status === 'PUBLISHED'}
        supportWallets={supportWallets}
      />

      {siteConfig.showWrittenBy && <ArticleAuthor author={article.author} />}

      <RelatedArticles articleSlug={slug} />
    </div>
  );
}
