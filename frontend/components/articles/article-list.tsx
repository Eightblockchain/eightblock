import type { Post } from 'contentlayer/generated';
import { ArticleCard } from '@/components/articles/article-card';

export function ArticleList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <ArticleCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
