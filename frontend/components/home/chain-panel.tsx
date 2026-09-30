import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Article } from '@/hooks/useInfiniteArticles';
import { formatBlockHeight, timeAgo } from '@/lib/chain';
import { cn } from '@eightblock/ui/utils';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

interface ChainPanelProps {
  articles: Article[];
  total: number;
}

/** Explorer-style list of the most recent posts, linked like a chain. */
export function ChainPanel({ articles, total }: ChainPanelProps) {
  return (
    <Panel>
      <PanelBar>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" aria-hidden="true" />
          Latest blocks
        </span>
        <span>
          Height <span className="text-foreground">{formatBlockHeight(total)}</span>
        </span>
      </PanelBar>

      {articles.length === 0 ? (
        <div className="px-4 py-14 text-center">
          <p className="font-display text-lg font-medium text-foreground">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">The first article is coming soon.</p>
        </div>
      ) : (
        <ol className="py-2">
          {articles.map((article, i) => {
            const isLast = i === articles.length - 1;
            return (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group relative flex gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="relative flex w-3 shrink-0 justify-center pt-1">
                    <span
                      className={cn(
                        'relative z-10 h-2.5 w-2.5 border',
                        i === 0
                          ? 'border-brand-blue bg-brand-blue'
                          : 'border-foreground/40 bg-card group-hover:border-brand-blue'
                      )}
                      aria-hidden="true"
                    />
                    {!isLast && (
                      <span
                        className="absolute left-1/2 top-[0.875rem] h-[calc(100%+1.125rem)] w-px -translate-x-1/2 bg-border"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="ledger-label flex items-center gap-2">
                      <span className="text-foreground">{formatBlockHeight(total - i)}</span>
                      <span aria-hidden="true">·</span>
                      <span suppressHydrationWarning>{timeAgo(article.publishedAt)}</span>
                      {article.category && (
                        <span className="ml-auto hidden truncate sm:inline">
                          {article.category}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block font-display text-[15px] font-medium leading-snug text-foreground transition-colors group-hover:text-brand-blue line-clamp-2">
                      {article.title}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        href="/writing"
        className="ledger-label flex h-11 items-center justify-between border-t border-border px-4 transition-colors hover:text-brand-blue"
      >
        Explore the full chain
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Panel>
  );
}
