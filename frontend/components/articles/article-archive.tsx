'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BlockCard } from '@/components/articles/block-card';
import { ShareButton } from '@eightblock/ui/components/share-button';
import { useInfiniteArticles } from '@/hooks/useInfiniteArticles';
import { getPublishedArticlesPaginated, getPublishedTopics } from '@/lib/api';
import { topicLabel } from '@/lib/topics';
import { cn } from '@eightblock/ui/utils';

const PAGE_SIZE = 15;

function CardSkeleton() {
  return (
    <div className="border border-border bg-card">
      <div className="h-9 border-b border-border" />
      <div className="aspect-[9/4] animate-pulse border-b border-border bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-4/5 animate-pulse bg-muted" />
        <div className="h-4 w-full animate-pulse bg-muted" />
      </div>
      <div className="h-[52px] border-t border-border" />
    </div>
  );
}

export function ArchiveSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Number of published articles, optionally for one author. */
export function usePublishedTotal(author?: string) {
  return useQuery({
    queryKey: ['articles', 'total', author ?? null],
    queryFn: async () =>
      (await getPublishedArticlesPaginated(1, 1, 'latest', { author })).pagination.total as number,
    staleTime: 60_000,
  });
}

interface ArticleArchiveProps {
  /** Page the topic links point at, e.g. "/writing" or "/authors/jane". */
  basePath: string;
  /** Active topic slug from `?tag=`. */
  tag: string | null;
  /** Display name of the active topic, when the server already resolved it. */
  tagName?: string | null;
  /** Only this author's articles (username). */
  author?: string;
  /** Number the cards as blocks. Only meaningful for the full, unfiltered chain. */
  numbered?: boolean;
  /** Offer a share button for the unfiltered list too (the topic view always has one). */
  shareAll?: boolean;
  /** Called with the total number of matching articles once known. */
  onTotal?: (total: number) => void;
}

/** Published articles, newest first, with shareable topic filters. Filtering happens on the server. */
export function ArticleArchive({
  basePath,
  tag,
  tagName,
  author,
  numbered = false,
  shareAll = true,
  onTotal,
}: ArticleArchiveProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArticles(PAGE_SIZE, 'latest', { author, tag: tag ?? undefined });

  const { data: topics } = useQuery({
    queryKey: ['topics', author ?? null],
    queryFn: () => getPublishedTopics(author),
    staleTime: 60_000,
  });

  const { data: allTotal } = usePublishedTotal(author);

  const total = data?.pages[0]?.pagination.total ?? 0;
  useEffect(() => {
    if (data) onTotal?.(total);
  }, [data, total, onTotal]);

  const articles = useMemo(() => data?.pages.flatMap((p) => p.articles) ?? [], [data]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    const el = observerTarget.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const chips = [
    { label: 'All', slug: null as string | null, count: allTotal },
    ...(topics ?? []).map((t) => ({
      label: t.name,
      slug: t.slug as string | null,
      count: t.count as number | undefined,
    })),
  ];
  const activeLabel = tag ? tagName || topicLabel(tag, topics) : null;
  if (tag && activeLabel && !chips.some((c) => c.slug === tag)) {
    chips.push({ label: activeLabel, slug: tag, count: data ? total : undefined });
  }
  const hrefFor = (slug: string | null) =>
    slug ? `${basePath}?tag=${encodeURIComponent(slug)}` : basePath;

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-border bg-background">
        <div className="container-page flex items-center gap-4 py-3">
          <nav
            aria-label="Filter by topic"
            className="scrollbar-hide flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            {chips.map(({ label, slug, count }) => {
              const active = tag === slug;
              return (
                <Link
                  key={slug ?? 'all'}
                  href={hrefFor(slug)}
                  scroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  {label}
                  {count !== undefined && (
                    <span
                      className={cn('font-mono text-[10px]', active ? 'opacity-80' : 'opacity-70')}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          {(tag || shareAll) && (
            <ShareButton
              url={hrefFor(tag)}
              label={tag ? 'Share topic' : 'Share'}
              className="h-8 shrink-0 px-3 text-xs"
            />
          )}
        </div>
      </div>

      <div className="container-page py-12 sm:py-14">
        {isLoading && <ArchiveSkeleton />}

        {isError && (
          <p className="py-8 text-sm text-muted-foreground">
            Could not load articles. Refresh the page to try again.
          </p>
        )}

        {!isLoading && !isError && articles.length === 0 && (
          <div className="border border-dashed border-border px-6 py-20 text-center">
            <p className="font-display text-lg font-medium text-foreground">No blocks here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeLabel
                ? `Nothing published under “${activeLabel}” so far.`
                : 'No articles published yet.'}
            </p>
            {tag && (
              <Link href={basePath} scroll={false} className="btn-pill-outline mt-6">
                Show all articles
              </Link>
            )}
          </div>
        )}

        {articles.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <BlockCard
                key={article.id}
                article={article}
                height={numbered && !tag ? total - i : undefined}
                priority={i < 3}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div ref={observerTarget} className="mt-12 flex justify-center">
            {isFetchingNextPage && <span className="ledger-label">Syncing more blocks…</span>}
          </div>
        )}
      </div>
    </>
  );
}
