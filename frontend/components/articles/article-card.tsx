import Link from 'next/link';
import { Post } from 'contentlayer/generated';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ArticleCard({ post }: { post: Post }) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="mb-2 flex gap-2">
          <Badge variant="secondary">{post.category}</Badge>
          {post.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <CardTitle className="line-clamp-2 text-xl">
          <Link href={`/articles/${post.slug}`}>{post.title}</Link>
        </CardTitle>
        <CardDescription>{post.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString()} • {post.readingTime} min read
        </p>
      </CardContent>
    </Card>
  );
}
