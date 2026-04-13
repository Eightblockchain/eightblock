import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleHeader } from '@/components/articles/article-header';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleAuthor } from '@/components/articles/article-author';
import { ArticleClientWrapper } from '@/components/articles/article-client-wrapper';
import { RelatedArticles } from '@/components/articles/related-articles';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';

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
    // relative path — not usable directly for OG
    return null;
  }
}

export const revalidate = 3600; // Re-generate pages every hour

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
      const articles = Array.isArray(data) ? data : data.articles ?? [];
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const article = await res.json();

    const title = article.title;
    const rawDesc = article.description || article.content?.slice(0, 200) || '';
    const description = rawDesc.length > 160
      ? rawDesc.slice(0, rawDesc.lastIndexOf(' ', 160)) + '…'
      : rawDesc.trim();
    const url = `${BASE_URL}/articles/${slug}`;

    // Use article's featured image if it's a public https URL, otherwise generate a dynamic OG image.
    // Use a relative path for the dynamic OG so Next.js resolves it via metadataBase
    // (guarantees correct production domain regardless of NEXT_PUBLIC_SITE_URL env var).
    const safeFeaturedImage = sanitizeOgImageUrl(article.featuredImage);
    const ogImageUrl = safeFeaturedImage
      ? safeFeaturedImage
      : `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description.slice(0, 100))}`;

    const ogImageEntry = { url: ogImageUrl, width: 1200, height: 630, alt: title };

    return {
      title,
      description,
      keywords: article.tags?.map((t: any) => t.tag.name).join(', ') || '',
      authors: [{ name: article.author?.name || 'Anonymous' }],
      openGraph: {
        title,
        description,
        url,
        images: [ogImageEntry],
        type: 'article',
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt || article.publishedAt,
        authors: [`${BASE_URL}/profile/${article.author?.walletAddress}`],
        siteName: 'Eightblock',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
      alternates: {
        canonical: url,
      },
      robots: {
        index: article.status === 'PUBLISHED',
        follow: article.status === 'PUBLISHED',
      },
    };
  } catch (e) {
    return {};
  }
}

async function fetchArticle(slug: string) {
  const response = await fetch(`${API_URL}/articles/${slug}`, { next: { revalidate: 3600 } });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Article not found');
    throw new Error('Failed to fetch article');
  }
  return response.json();
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: any;
  try {
    article = await fetchArticle(slug);
  } catch (e) {
    notFound();
  }

  if (!article || article.status !== 'PUBLISHED') {
    // For SEO, return 404 if not published
    notFound();
  }

  const readingTime = article ? Math.ceil(article.content.split(' ').length / 200) : 0;

  // JSON-LD structured data
  const canonicalUrl = `${BASE_URL}/articles/${slug}`;
  const safeImage = sanitizeOgImageUrl(article.featuredImage) || `${BASE_URL}/og.png`;
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
      url: `${BASE_URL}/profile/${article.author?.walletAddress}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Eightblock',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.svg`,
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
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${BASE_URL}/articles` },
      { '@type': 'ListItem', position: 3, name: article.title },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>

      <ArticleHeader article={article} readingTime={readingTime} />

      <ArticleContent content={article.content} />

      {/* Engagement and comments with proper cookie-based authentication */}
      <ArticleClientWrapper
        articleId={article.id}
        articleSlug={slug}
        authorId={article.author?.id ?? null}
        initialLikesCount={article._count?.likes || 0}
        initialCommentsCount={article._count?.comments || 0}
        initialViewCount={article.viewCount || 0}
        isPublished={article.status === 'PUBLISHED'}
      />

      <ArticleAuthor author={article.author} />

      {/* Related Articles Section */}
      <RelatedArticles articleSlug={slug} />
    </div>
  );
}
