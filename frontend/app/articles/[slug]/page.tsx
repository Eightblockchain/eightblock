import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArticleHeader } from '@/components/articles/article-header';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleEngagement } from '@/components/articles/article-engagement';
import { ArticleAuthor } from '@/components/articles/article-author';
import { CommentsSection } from '@/components/articles/comments-section';

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

      <ArticleHeader
        article={article}
        readingTime={readingTime}
        isOwner={false}
        onBack={() => {}}
      />

      <ArticleContent content={article.content} />

      {/* Engagement and comments are client components and will hydrate on the client */}
      <ArticleEngagement
        likesCount={article._count?.likes || 0}
        commentsCount={article._count?.comments || 0}
        userLiked={false}
        bookmarked={false}
        isLiking={false}
        onLike={() => {}}
        onComment={() => {
          const commentsSection = document.getElementById('comments');
          commentsSection?.scrollIntoView({ behavior: 'smooth' });
        }}
        onShare={() => {}}
        onBookmark={() => {}}
      />

      <ArticleAuthor author={article.author} />

      <CommentsSection
        comments={[]}
        totalComments={article._count?.comments || 0}
        hasMoreComments={false}
        isLoadingMoreComments={false}
        isAuthenticated={false}
        currentUserId={null}
        isPostingComment={false}
        isUpdatingComment={false}
        isDeletingComment={false}
        onPostComment={() => {}}
        onUpdateComment={() => {}}
        onDeleteComment={() => {}}
        onLoadMoreComments={() => {}}
      />

      <div className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Ready to explore more articles?</h2>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Browse All Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
