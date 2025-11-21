import { Badge } from '@/components/ui/badge';
import type { Post } from 'contentlayer/generated';

export function ArticleMeta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span>By {post.author}</span>
      <span>•</span>
      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
      <span>•</span>
      <span>{post.readingTime} min read</span>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
