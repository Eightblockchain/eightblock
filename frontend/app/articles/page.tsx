import type { Metadata } from 'next';
import { ArticleList } from '@/components/articles/article-list';
import { getPublishedArticles } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse Cardano, Intersect, and blockchain knowledge from the community.',
};

// Force dynamic rendering to fetch latest articles
export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  let articles = [];

  try {
    articles = await getPublishedArticles();
  } catch (error) {
    console.error('Failed to fetch articles:', error);
  }

  // Transform API data to match the expected format
  const posts = articles.map((article: any) => ({
    ...article,
    publishedAt: article.publishedAt,
    url: `/articles/${article.slug}`,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div>
        <p className="text-sm uppercase tracking-wide text-primary/80">Knowledge base</p>
        <h1 className="text-4xl font-bold">All Articles</h1>
        <p className="mt-3 text-muted-foreground">
          Filter by categories such as Cardano, Intersect, governance, and more using the tags
          below.
        </p>
      </div>
      {articles.length === 0 ? (
        <p className="text-center text-muted-foreground">No articles found.</p>
      ) : (
        <ArticleList posts={posts} />
      )}
    </div>
  );
}
