'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BlockCard } from '@/components/articles/block-card';
import { ShareButton } from '@eightblock/ui/components/share-button';
import { useInfiniteArticles } from '@/hooks/useInfiniteArticles';
import { getPublishedArticlesPaginated, getPublishedTopics } from '@/lib/api';
import { topicLabel } from '@/lib/topics';
import type { PublishedCategory } from '@/lib/categories';
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
  /** Active category slug from `?category=`. Combines with the topic. */
  category?: string | null;
  categoryName?: string | null;
  /** Offer category filters. Left out on pages that only filter by topic. */
  categories?: PublishedCategory[];
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
  category = null,
  categoryName = null,
  categories,
  author,
  numbered = false,
  shareAll = true,
  onTotal,
}: ArticleArchiveProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArticles(PAGE_SIZE, 'latest', {
      author,
      tag: tag ?? undefined,
      category: category ?? undefined,
    });

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

  const filtered = Boolean(tag || category);
  const topicChips = (topics ?? []).map((t) => ({
    label: t.name,
    slug: t.slug as string | null,
    count: t.count as number | undefined,
  }));
  const tagLabel = tag ? tagName || topicLabel(tag, topics) : null;
  if (tag && tagLabel && !topicChips.some((c) => c.slug === tag)) {
    topicChips.push({ label: tagLabel, slug: tag, count: data ? total : undefined });
  }

  const categoryChips = (categories ?? [])
    .filter((c) => c.count > 0 || c.slug === category)
    .map((c) => ({ label: c.name, slug: c.slug, count: c.count }));
  if (category && categoryName && !categoryChips.some((c) => c.slug === category)) {
    categoryChips.push({ label: categoryName, slug: category, count: data ? total : 0 });
  }

  const activeLabel = [categoryName, tagLabel].filter(Boolean).join(' · ') || null;

  const hrefFor = (next: { category?: string | null; tag?: string | null }) => {
    const query = new URLSearchParams();
    const nextCategory = next.category === undefined ? category : next.category;
    const nextTag = next.tag === undefined ? tag : next.tag;
    if (nextCategory) query.set('category', nextCategory);
    if (nextTag) query.set('tag', nextTag);
    const search = query.toString();
    return search ? `${basePath}?${search}` : basePath;
  };
  const shareHref = hrefFor({});

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-foreground bg-foreground text-background'
        : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
    );
  const countBadge = (count: number | undefined, active: boolean) =>
    count !== undefined && (
      <span className={cn('font-mono text-[10px]', active ? 'opacity-80' : 'opacity-70')}>
        {count}
      </span>
    );

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-border bg-background">
        <div className="container-page flex items-center gap-4 py-3">
          <nav
            aria-label="Filter articles"
            className="scrollbar-hide flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          >
            <Link
              href={basePath}
              scroll={false}
              aria-current={!filtered ? 'page' : undefined}
              className={chipClass(!filtered)}
            >
              All
              {countBadge(allTotal, !filtered)}
            </Link>

            {categoryChips.length > 0 && (
              <>
                <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
                {categoryChips.map(({ label, slug, count }) => {
                  const active = category === slug;
                  return (
                    <Link
                      key={`category-${slug}`}
                      href={hrefFor({ category: active ? null : slug })}
                      scroll={false}
                      aria-current={active ? 'page' : undefined}
                      title={active ? `Stop filtering by ${label}` : `Only ${label} articles`}
                      className={chipClass(active)}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
                      {label}
                      {countBadge(count, active)}
                    </Link>
                  );
                })}
              </>
            )}

            {topicChips.length > 0 && (
              <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
            )}
            {topicChips.map(({ label, slug, count }) => {
              const active = tag === slug;
              return (
                <Link
                  key={`tag-${slug}`}
                  href={hrefFor({ tag: active ? null : slug })}
                  scroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={chipClass(active)}
                >
                  {label}
                  {countBadge(count, active)}
                </Link>
              );
            })}
          </nav>
          {(filtered || shareAll) && (
            <ShareButton
              url={shareHref}
              label={filtered ? 'Share filter' : 'Share'}
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
            {filtered && (
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
                height={numbered && !filtered ? total - i : undefined}
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
