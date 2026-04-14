'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/lib/wallet-context';
import {
  Bookmark, BookmarkX, BookOpen, ArrowUpRight, Clock, Calendar, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBookmarkedArticles, deleteBookmark, ArticleSummary } from '@/lib/article-api';
import { ProfileBookmarksSkeleton } from '@/components/profile/profile-skeleton';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function readingTime(content: string) {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return Math.max(1, Math.ceil(text.split(' ').filter(Boolean).length / 200));
}

function getInitials(name: string | null, address: string) {
  if (name) return name.slice(0, 2).toUpperCase();
  return address.slice(2, 4).toUpperCase();
}

/* ── Bookmark card ────────────────────────────────────────────────── */
function BookmarkCard({
  article,
  onRemove,
}: {
  article: ArticleSummary;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const mins = readingTime(article.content);
  const tags = article.tags.slice(0, 3);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    try {
      await deleteBookmark(article.id);
      onRemove(article.id);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card
        dark:border-border/40 overflow-hidden
        hover:border-primary/30 dark:hover:border-primary/25
        hover:shadow-lg hover:shadow-primary/5
        transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40 dark:bg-muted/20 flex-shrink-0">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          /* gradient placeholder */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0
              bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,hsl(var(--primary)/0.08),transparent)]" />
            <BookOpen className="h-8 w-8 text-muted-foreground/15" />
          </div>
        )}
        {/* remove button — top-right overlay */}
        <button
          onClick={handleRemove}
          disabled={removing}
          title="Remove bookmark"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center
            rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm
            text-muted-foreground/60
            hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500
            disabled:opacity-50
            opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          {removing
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <BookmarkX className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 py-4 gap-3">

        {/* Category + reading time */}
        <div className="flex items-center justify-between gap-2">
          {article.category && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-primary/60 truncate">
              {article.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40 flex-shrink-0 ml-auto">
            <Clock className="h-3 w-3" />
            {mins} min
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold leading-snug text-foreground
          group-hover:text-primary transition-colors duration-150 line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.description && (
          <p className="text-[13px] leading-relaxed text-muted-foreground/60 line-clamp-2 flex-1">
            {article.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full border border-accent/25
                  bg-accent/8 dark:bg-accent/10 px-2 py-0.5
                  font-mono text-[10px] text-accent/70"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-border/20 mt-auto">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            {article.author.avatarUrl ? (
              <Image
                src={article.author.avatarUrl}
                alt={article.author.name || ''}
                width={20}
                height={20}
                className="rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full
                border border-border/50 bg-muted/50 flex-shrink-0">
                <span className="font-mono text-[8px] font-bold text-muted-foreground/50">
                  {getInitials(article.author.name, article.author.walletAddress)}
                </span>
              </div>
            )}
            <span className="text-[12px] text-muted-foreground/50 truncate">
              {article.author.name || `${article.author.walletAddress.slice(0, 6)}…`}
            </span>
          </div>

          {/* Date */}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/35 flex-shrink-0">
            <Calendar className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function BookmarksPage() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const shouldFetch = Boolean(address);

  const {
    data: bookmarkedArticles = [],
    isFetching,
    isError,
    error,
  } = useQuery<ArticleSummary[]>({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarkedArticles,
    enabled: shouldFetch,
  });

  const loading = shouldFetch && isFetching;

  const handleRemove = (removedId: string) => {
    queryClient.setQueryData<ArticleSummary[]>(
      ['bookmarks'],
      (old) => (old ?? []).filter((a) => a.id !== removedId),
    );
  };

  /* ── Not connected ── */
  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
            border border-border bg-card dark:border-border/30">
            <Bookmark className="h-7 w-7 text-muted-foreground/25" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">Wallet Required</h1>
          <p className="text-[14px] text-muted-foreground/55 mb-6">
            Connect your wallet to access your saved articles
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5
              text-[13px] font-bold text-primary-foreground shadow-md shadow-primary/20
              hover:brightness-105 transition-all duration-150"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <ProfileBookmarksSkeleton />;

  /* ── Error ── */
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-[14px] text-destructive">
            {(error as Error)?.message || 'Failed to load bookmarks'}
          </p>
          <Link href="/" className="mt-4 inline-block text-[13px] text-primary/70 hover:text-primary">
            ← Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 dark:border-border/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_-10%,hsl(var(--primary)/0.07),transparent)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)/0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-px w-5 bg-primary/50" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                  Library
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none mb-3">
                Bookmarks
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30
                  bg-primary/8 dark:bg-primary/10 px-3 py-1
                  text-[12px] font-semibold text-primary/70">
                  <Bookmark className="h-3 w-3" />
                  {bookmarkedArticles.length} saved article{bookmarkedArticles.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Explore CTA */}
            <Link
              href="/"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                border border-border/60 dark:border-border/30
                bg-muted/40 dark:bg-card/60
                px-4 py-2.5 text-[13px] font-semibold
                text-muted-foreground/70 hover:text-foreground hover:border-border
                active:scale-[0.97] transition-all duration-150 self-start sm:self-auto flex-shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Explore Articles
              <ArrowUpRight className="h-3 w-3 opacity-50 -ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">

        {bookmarkedArticles.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,hsl(var(--primary)/0.15),transparent)] blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl
                border border-border bg-card dark:border-border/30">
                <Bookmark className="h-9 w-9 text-muted-foreground/20" />
              </div>
            </div>
            <h2 className="text-xl font-black text-foreground mb-2">Nothing saved yet</h2>
            <p className="text-[14px] text-muted-foreground/55 max-w-sm mb-8 leading-relaxed">
              Bookmark articles as you read — click the bookmark icon on any article to save it here.
            </p>
            <Link
              href="/"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground
                shadow-md shadow-primary/20 hover:brightness-105
                active:scale-[0.97] transition-all duration-150"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                group-hover:translate-x-full transition-transform duration-500" />
              <BookOpen className="h-3.5 w-3.5" />
              Explore Articles
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarkedArticles.map((article) => (
              <BookmarkCard
                key={article.id}
                article={article}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
