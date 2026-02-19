import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleHeader } from '@/components/articles/article-header';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleAuthor } from '@/components/articles/article-author';
import { ArticleClientWrapper } from '@/components/articles/article-client-wrapper';
import { RelatedArticles } from '@/components/articles/related-articles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/articles/${slug}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const article = await res.json();

    const title = article.title;
    const description = article.description || article.content.slice(0, 160);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';
    const url = `${baseUrl}/articles/${slug}`;

    // Generate dynamic OG image or use article's featured image
    const ogImage =
      article.featuredImage ||
      `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description.slice(0, 100))}`;

    return {
      title,
      description,
      keywords: article.tags?.map((t: any) => t.tag.name).join(', ') || '',
      authors: [{ name: article.author?.name || 'Anonymous' }],
      openGraph: {
        title,
        description,
        url,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        type: 'article',
        publishedTime: article.publishedAt,
        authors: [article.author?.name || 'Anonymous'],
        siteName: 'Eightblock',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
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
  const response = await fetch(`${API_URL}/articles/${slug}`);
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image:
      article.featuredImage ||
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev'}/og.png`,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Anonymous',
    },
    datePublished: article.publishedAt,
    mainEntityOfPage: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev'}/articles/${slug}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <ArticleHeader article={article} readingTime={readingTime} isOwner={false} />

      <ArticleContent content={article.content} />

      {/* Engagement and comments with proper cookie-based authentication */}
      <ArticleClientWrapper
        articleId={article.id}
        articleSlug={slug}
        initialLikesCount={article._count?.likes || 0}
        initialCommentsCount={article._count?.comments || 0}
        isPublished={article.status === 'PUBLISHED'}
      />

      <ArticleAuthor author={article.author} />

      {/* Related Articles Section */}
      <RelatedArticles articleSlug={slug} />
    </div>
  );
}
