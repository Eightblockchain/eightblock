import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@eightblock/ui/utils';
import type { Article } from '@/hooks/useInfiniteArticles';
import { articleHash, formatBlockDate, formatBlockHeight, readingTime } from '@/lib/chain';
import { BlockPattern } from '@/components/chain/block-pattern';
import { CornerMarks } from '@eightblock/ui/components/panel';
import { TopicChip } from '@eightblock/ui/components/topic-chip';
import { BlockStats } from '@/components/articles/article-stats';

interface BlockCardProps {
  article: Article;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * A post rendered as a block: header (height + date), cover,
 * content, and an on-chain style data strip.
 */
export function BlockCard({ article, height, className, priority }: BlockCardProps) {
  const hash = articleHash(article);

  return (
    <article
      className={cn(
        'group relative flex flex-col border border-border bg-card transition-colors duration-200 hover:border-brand-blue/50',
        className
      )}
    >
      <CornerMarks className="text-brand-blue opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <Link
        href={`/articles/${article.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
      >
        <div className="ledger-label flex h-9 items-center justify-between border-b border-border px-4">
          {height !== undefined ? (
            <span>
              Block <span className="text-foreground">{formatBlockHeight(height)}</span>
            </span>
          ) : (
            <span>{readingTime(article.content)} min read</span>
          )}
          <time
            dateTime={article.publishedAt}
            className="transition-colors group-hover:text-brand-blue"
          >
            {formatBlockDate(article.publishedAt)}
          </time>
        </div>

        <div className="relative aspect-[9/4] overflow-hidden border-b border-border bg-background">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <BlockPattern seed={hash} className="absolute inset-0 h-full w-full" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          {article.category && (
            <div className="mb-4">
              <TopicChip category={article.category} />
            </div>
          )}
          <h3 className="font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-brand-blue line-clamp-3">
            {article.title}
          </h3>
          {article.description && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {article.description}
            </p>
          )}
        </div>

        <BlockStats
          readingTime={readingTime(article.content)}
          views={article.viewCount}
          claps={article._count?.likes}
          replies={article._count?.comments}
        />
      </Link>
    </article>
  );
}
