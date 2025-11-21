import type { Metadata } from 'next';
import { allPosts } from 'contentlayer/generated';
import { ArticleList } from '@/components/articles/article-list';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse Cardano, Intersect, and blockchain knowledge from the community.',
};

export default function ArticlesPage() {
  const posts = allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div>
        <p className="text-sm uppercase tracking-wide text-primary/80">Knowledge base</p>
        <h1 className="text-4xl font-bold">All Articles</h1>
        <p className="mt-3 text-muted-foreground">
          Filter by categories such as Cardano, Intersect, governance, and more using the tags below.
        </p>
      </div>
      <ArticleList posts={posts} />
    </div>
  );
}
