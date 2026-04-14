import Link from 'next/link';
import { Post } from 'contentlayer/generated';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Article } from '@/hooks/useInfiniteArticles';

export function ArticleCard({ post }: { post: Post | Article }) {
  const isArticle = '_count' in post;
  const readingTime =
    'readingTime' in post
      ? post.readingTime
      : Math.max(1, Math.ceil((post.content?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length || 0) / 200));

  const featuredImage = isArticle ? (post as Article).featuredImage : null;
  const publishedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link href={`/articles/${post.slug}`} className="group block h-full">
      <article className="card-glow h-full flex flex-col overflow-hidden rounded-xl bg-card transition-all duration-300 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="aspect-video w-full overflow-hidden relative flex-shrink-0 bg-muted">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={post.title}
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="h-full w-full bg-card relative">
              {/* Grid overlay */}
              <div className="absolute inset-0 grid-bg opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <h3 className="text-sm sm:text-base font-semibold text-foreground/90 text-center leading-tight line-clamp-3">
                  {post.title}
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">
          {/* Category badge */}
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {post.title}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {post.description}
          </p>

          {/* Footer: author + meta */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground truncate">
              {typeof post.author === 'object'
                ? post.author?.name || 'Anonymous'
                : post.author || 'Anonymous'}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
              <Clock className="h-3 w-3 text-accent" />
              <span className="text-accent">{readingTime} min</span>
              <span className="hidden xs:inline ml-1 text-muted-foreground/40">·</span>
              <span className="hidden xs:inline text-muted-foreground/70">{publishedDate}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
