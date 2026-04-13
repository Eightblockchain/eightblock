'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Article } from '@/hooks/useInfiniteArticles';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface ExploreSectionProps {
  articles: Article[];
  allArticles: Article[];
  searchQuery: string;
  isLoading: boolean;
  onClearSearch: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  observerTarget: React.RefObject<HTMLDivElement>;
}

// ────────────────────────────────────────────────────────────────────────────
// Accent per entry — deterministic
// ────────────────────────────────────────────────────────────────────────────
function entryAccent(index: number, category?: string): 'gold' | 'blue' {
  if (category) {
    const c = category.toLowerCase();
    if (c.includes('zk') || c.includes('zero') || c.includes('privacy') || c.includes('midnight')) return 'gold';
    if (c.includes('cardano') || c.includes('defi') || c.includes('tutorial') || c.includes('web3')) return 'blue';
  }
  return index % 2 === 0 ? 'gold' : 'blue';
}

// ────────────────────────────────────────────────────────────────────────────
// Article Entry Row — generous whitespace, editorial
// ────────────────────────────────────────────────────────────────────────────
function ArticleEntry({
  article,
  index,
  delay = 0,
}: {
  article: Article;
  index: number;
  delay?: number;
}) {
  const accent = entryAccent(index, article.category);
  const isGold = accent === 'gold';
  const readingTime = Math.max(1, Math.ceil((article.content?.split(' ').length ?? 300) / 200));
  const authorName = article.author?.name || 'Anonymous';
  const authorAvatar = article.author?.avatarUrl ?? null;
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration: 0.35, delay }}
    >
      <Link href={`/articles/${article.slug}`} className="group block">
        <div className="relative flex gap-6 sm:gap-9 items-start py-7 sm:py-9 px-5 -mx-5 rounded-2xl transition-colors duration-300 hover:bg-card/45 border-b border-border/20">

          {/* Animated left accent bar */}
          <div
            className={`absolute left-1 top-7 bottom-7 w-[3px] rounded-full scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300 ${
              isGold ? 'bg-primary' : 'bg-accent'
            }`}
          />

          {/* ── LEFT: Ghost number + category ── */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2 w-10 sm:w-14 pt-0.5">
            <span
              className={`font-black text-[34px] sm:text-[42px] leading-none tabular-nums select-none transition-colors duration-300 ${
                isGold
                  ? 'text-foreground/[0.05] group-hover:text-primary/[0.22]'
                  : 'text-foreground/[0.05] group-hover:text-accent/[0.22]'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            {article.category && (
              <span
                className={`font-mono text-[8px] uppercase tracking-[0.18em] text-right leading-tight transition-colors duration-300 ${
                  isGold
                    ? 'text-primary/30 group-hover:text-primary/65'
                    : 'text-accent/30 group-hover:text-accent/65'
                }`}
              >
                {article.category}
              </span>
            )}
          </div>

          {/* ── CENTER: content ── */}
          <div className="flex-1 min-w-0">
            {/* Latest indicator — first entry only */}
            {index === 0 && (
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary/55">
                  Latest
                </span>
              </div>
            )}

            {/* Title */}
            <h3
              className={`text-[15px] sm:text-[17px] font-black leading-snug mb-2 transition-colors duration-200 ${
                isGold
                  ? 'text-foreground group-hover:text-primary'
                  : 'text-foreground group-hover:text-accent'
              }`}
            >
              {article.title}
            </h3>

            {/* Description */}
            {article.description && (
              <p className="hidden sm:block text-[13px] text-muted-foreground/50 line-clamp-2 leading-relaxed mb-3">
                {article.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/35 flex-wrap mt-1 sm:mt-0">
              <Avatar src={authorAvatar} name={authorName} size="xs" />
              <span className="font-medium text-muted-foreground/50 max-w-[90px] sm:max-w-none truncate">
                {authorName}
              </span>
              <span className="opacity-30">·</span>
              <span>{formattedDate}</span>
              <span className="opacity-30">·</span>
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{readingTime}m</span>
            </div>
          </div>

          {/* ── RIGHT: Thumbnail ── */}
          <div className="hidden sm:block flex-shrink-0">
            <div className="relative w-[100px] h-[72px] rounded-xl overflow-hidden border border-border/30 bg-muted/20">
              {article.featuredImage ? (
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute inset-0 grid-bg opacity-[0.15] flex items-center justify-center">
                  <span className="font-black text-4xl text-muted-foreground/[0.07]">
                    {article.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow on hover */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowUpRight
              className={`w-4 h-4 ${isGold ? 'text-primary/50' : 'text-accent/50'}`}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex gap-6 sm:gap-9 items-start py-7 sm:py-9 px-5 -mx-5 border-b border-border/20 animate-pulse"
        >
          <div className="flex-shrink-0 w-10 sm:w-14 flex flex-col items-end gap-2 pt-0.5">
            <div className="h-9 w-9 bg-muted rounded" />
            <div className="h-2 w-12 bg-muted/40 rounded" />
          </div>
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-[60%] bg-muted rounded" />
            <div className="hidden sm:block h-3.5 w-full bg-muted/60 rounded" />
            <div className="hidden sm:block h-3.5 w-[75%] bg-muted/40 rounded" />
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-4 w-4 rounded-full bg-muted/50" />
              <div className="h-3 w-28 bg-muted/40 rounded" />
            </div>
          </div>
          <div className="hidden sm:block w-[100px] h-[72px] rounded-xl bg-muted/50 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────────────────────────
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="py-24 text-center">
      <p className="font-black text-[80px] sm:text-[120px] leading-none text-foreground/[0.04] select-none mb-6">
        ∅
      </p>
      <p className="font-bold text-foreground mb-2">
        {searchQuery ? 'No records found' : 'Archive is empty'}
      </p>
      <p className="text-sm text-muted-foreground">
        {searchQuery
          ? `No articles matched "${searchQuery}". Try different keywords.`
          : 'New content will appear here soon.'}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main export
// ────────────────────────────────────────────────────────────────────────────
export const ExploreSection = React.forwardRef<HTMLDivElement, ExploreSectionProps>(
  (
    {
      articles,
      allArticles,
      searchQuery,
      isLoading,
      onClearSearch,
      hasNextPage,
      isFetchingNextPage,
      observerTarget,
    },
    ref
  ) => {
    const hasArticles = articles.length > 0;

    return (
      <section ref={ref} id="articles" className="py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">

          {/* ── Section Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-start justify-between gap-6">
              {/* Left: title block */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/30">
                    {searchQuery ? 'Search Results' : 'Latest Dispatches'}
                  </span>
                </div>
                <h2 className="text-[36px] sm:text-[50px] lg:text-[62px] font-black leading-[0.92] tracking-tighter">
                  {searchQuery ? (
                    <span className="text-foreground">
                      &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;
                    </span>
                  ) : (
                    <>
                      <span className="text-foreground">Explore</span>
                      <br />
                      <span className="text-foreground/[0.18]">Articles</span>
                    </>
                  )}
                </h2>
              </div>

              {/* Right: ghost record count */}
              <div className="flex-shrink-0 pt-1">
                {searchQuery ? (
                  <div className="flex flex-col items-end gap-3">
                    <span className="font-black text-[44px] leading-none tabular-nums text-foreground/[0.05]">
                      {String(articles.length).padStart(2, '0')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClearSearch}
                      className="text-xs gap-1.5 border-border hover:border-primary/50 hover:text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>
                ) : !isLoading && allArticles.length > 0 ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-black text-[52px] sm:text-[68px] leading-none tabular-nums text-foreground/[0.035]">
                      {String(allArticles.length).padStart(3, '0')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/25">
                        records
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Three-segment ruled divider */}
            <div className="mt-7 flex items-center">
              <div className="h-[2px] w-12 bg-primary rounded-sm" />
              <div className="h-[2px] w-8 bg-accent/45 rounded-sm" />
              <div className="h-px flex-1 bg-border/30" />
            </div>
          </motion.div>

          {/* ── Content ── */}
          {isLoading ? (
            <RowSkeleton />
          ) : !hasArticles ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <>
              <div>
                {articles.map((article, index) => (
                  <ArticleEntry
                    key={article.slug}
                    article={article}
                    index={index}
                    delay={Math.min(index * 0.04, 0.35)}
                  />
                ))}
              </div>

              {/* ── Infinite scroll sentinel ── */}
              <div ref={observerTarget} className="mt-12 flex justify-center">
                {isFetchingNextPage && (
                  <div className="inline-flex items-center gap-4 px-6 py-3 bg-card border border-border/60 rounded-xl">
                    <div className="flex items-end gap-0.5 h-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 rounded-sm bg-primary/70"
                          style={{ height: '100%' }}
                          animate={{ scaleY: [0.25, 1, 0.25] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.14,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground/50">
                      Loading next batch&hellip;
                    </span>
                  </div>
                )}

                {!hasNextPage && allArticles.length > 0 && !isFetchingNextPage && (
                  <div className="flex items-center gap-5 text-muted-foreground/20">
                    <div className="h-px w-16 bg-border/40" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-[0.4em] whitespace-nowrap">
                        End of Archive
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground/15 tabular-nums">
                        {allArticles.length} records indexed
                      </span>
                    </div>
                    <div className="h-px w-16 bg-border/40" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }
);
ExploreSection.displayName = 'ExploreSection';
