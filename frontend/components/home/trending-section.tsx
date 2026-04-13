'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Flame, Heart, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import type { Article } from '@/hooks/useInfiniteArticles';

interface TrendingSectionProps {
  articles: Article[];
  isLoading: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Featured card — rank #1, large left-column format
// ────────────────────────────────────────────────────────────────────────────
function FeaturedCard({ article }: { article: Article }) {
  const readingTime = Math.ceil((article.content?.split(' ').length || 0) / 200);
  const likes = article._count?.likes || 0;
  const comments = article._count?.comments || 0;
  const authorName = article.author?.name || 'Anonymous';

  return (
    <Link href={`/articles/${article.slug}`} className="group block h-full">
      <article className="relative overflow-hidden rounded-xl h-full min-h-[360px] sm:min-h-[420px] bg-card border border-border/60 transition-all duration-300 group-hover:border-primary/30">
        {/* Image */}
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 grid-bg opacity-50" />
        )}

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

        {/* Ghost rank watermark */}
        <div
          className="absolute top-0 right-2 text-[9rem] sm:text-[11rem] font-black leading-none select-none pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.04)' }}
          aria-hidden="true"
        >
          01
        </div>

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/40">
            <TrendingUp className="h-3 w-3" />
            #1 Trending
          </div>
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-sm border border-white/10 text-white/80 rounded-full">
            {article.category}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white/70">
              <span className="font-medium text-white/90 truncate max-w-[120px] sm:max-w-none">{authorName}</span>
              <span className="text-white/30">·</span>
              <div className="flex items-center gap-1 text-accent">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min</span>
              </div>
            </div>
            {(likes > 0 || comments > 0) && (
              <div className="flex items-center gap-3 text-white/60">
                {likes > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-400" />
                    <span className="font-medium">{likes}</span>
                  </span>
                )}
                {comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-accent" />
                    <span className="font-medium">{comments}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// List item — ranks #2-#5, compact right-column format
// ────────────────────────────────────────────────────────────────────────────
const rankStyles: Record<number, string> = {
  2: 'text-primary',
  3: 'text-accent',
};

function ListItem({ article, rank }: { article: Article; rank: number }) {
  const readingTime = Math.ceil((article.content?.split(' ').length || 0) / 200);
  const likes = article._count?.likes || 0;
  const comments = article._count?.comments || 0;
  const colorClass = rankStyles[rank] ?? 'text-muted-foreground/40';

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex items-start gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-card/30 rounded-lg px-2 -mx-2 transition-colors"
    >
      {/* Ghost rank number */}
      <div
        className={`flex-shrink-0 text-3xl sm:text-4xl font-black leading-none tabular-nums mt-0.5 w-8 text-center ${colorClass}`}
        aria-label={`Rank ${rank}`}
      >
        {String(rank).padStart(2, '0')}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {article.category}
        </span>
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
          {article.title}
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 text-accent/80">
            <Clock className="h-3 w-3" />
            <span>{readingTime} min</span>
          </div>
          {likes > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-400/70" />
              <span>{likes}</span>
            </span>
          )}
          {comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3 text-accent/60" />
              <span>{comments}</span>
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      {article.featuredImage && (
        <div className="flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-md overflow-hidden bg-muted">
          <Image
            src={article.featuredImage}
            alt={article.title}
            width={64}
            height={48}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Skeleton states
// ────────────────────────────────────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="rounded-xl min-h-[360px] sm:min-h-[420px] bg-card border border-border/40 animate-pulse">
      <div className="h-full w-full grid-bg opacity-20 rounded-xl" />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0 animate-pulse px-2">
      <div className="h-8 w-8 bg-muted rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="flex gap-3">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-8 bg-muted rounded" />
        </div>
      </div>
      <div className="h-10 w-14 rounded-md bg-muted flex-shrink-0" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main export
// ────────────────────────────────────────────────────────────────────────────
export function TrendingSection({ articles, isLoading }: TrendingSectionProps) {
  const [featured, ...rest] = articles;
  const listArticles = rest.slice(0, 4);

  return (
    <section className="py-16 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Trending Now</h2>
              {/* Pulsing live indicator */}
              <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                LIVE
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Most engaging articles based on community reactions
            </p>
          </div>

          {/* Rank legend — desktop only */}
          {!isLoading && articles.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
              <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/20 text-primary">
                #1
              </span>
              <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/20 text-accent">
                #2
              </span>
              <span className="px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-medium">
                #3+
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <FeaturedSkeleton />
            <div>
              {[...Array(4)].map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? null : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
          >
            {/* Featured article — rank #1 */}
            {featured && <FeaturedCard article={featured} />}

            {/* List — ranks #2-#5 */}
            {listArticles.length > 0 && (
              <div className="flex flex-col">
                {listArticles.map((article, index) => (
                  <ListItem key={article.slug} article={article} rank={index + 2} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
