'use client';

import { PenLine, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { ArticleCard } from '@/components/profile/ArticleCard';
import { EmptyState } from '@/components/profile/EmptyState';
import { ProfileArticlesSkeleton } from '@/components/profile/profile-skeleton';

export default function MyArticlesPage() {
  const {
    connected,
    connecting,
    isChecking,
    articles,
    loading,
    pagination,
    refreshArticles,
    goToPage,
    nextPage,
    prevPage,
  } = useProfile();

  if (isChecking || connecting || loading) {
    return <ProfileArticlesSkeleton />
  }

  if (!connected) {
    return null;
  }

  const publishedCount = articles.filter((a: any) => a.status === 'PUBLISHED').length;
  const draftCount = articles.filter((a: any) => a.status === 'DRAFT').length;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 dark:border-border/20">
        {/* bg grid + accent */}
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
                  My Work
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none mb-3">
                Articles
              </h1>
              {/* pill counters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 dark:bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {publishedCount} Published
                </span>
                {draftCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/8 dark:bg-amber-500/10 px-3 py-1 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {draftCount} Draft{draftCount !== 1 ? 's' : ''}
                  </span>
                )}
                {pagination.total > 0 && (
                  <span className="text-[12px] text-muted-foreground/50">
                    {pagination.total} total
                  </span>
                )}
              </div>
            </div>

            {/* New Article CTA */}
            <Link
              href="/articles/new"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground
                shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.97]
                transition-all duration-150 self-start sm:self-auto flex-shrink-0"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                group-hover:translate-x-full transition-transform duration-500" />
              <Plus className="h-3.5 w-3.5" />
              New Article
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-3">
              {articles.map((article: any) => (
                <ArticleCard key={article.id} article={article} onDelete={refreshArticles} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card dark:border-border/40 p-1.5">
                  <button
                    onClick={() => pagination.hasPrev && prevPage()}
                    disabled={!pagination.hasPrev}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[13px]
                      text-muted-foreground/60 hover:bg-muted dark:hover:bg-muted/30 hover:text-foreground
                      disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 1;
                    if (!showPage) {
                      if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
                        return (
                          <span key={page} className="flex h-8 w-8 items-center justify-center text-[12px] text-muted-foreground/40">
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                    const isActive = page === pagination.currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-semibold transition-all duration-150
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground/60 hover:bg-muted dark:hover:bg-muted/30 hover:text-foreground'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => pagination.hasNext && nextPage()}
                    disabled={!pagination.hasNext}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[13px]
                      text-muted-foreground/60 hover:bg-muted dark:hover:bg-muted/30 hover:text-foreground
                      disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

