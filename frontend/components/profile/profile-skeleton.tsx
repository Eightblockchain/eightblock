import { Skeleton } from '@/components/ui/skeleton';

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="border-b border-border/50 dark:border-border/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Avatar */}
            <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl flex-shrink-0" />

            {/* Identity */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-72" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">

        {/* Stats tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card dark:border-border/30 p-5">
              <Skeleton className="h-8 w-8 rounded-xl mb-3" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-2.5 w-20 mt-1.5" />
            </div>
          ))}
        </div>

        {/* Wallet card */}
        <div className="rounded-2xl border border-border bg-card dark:border-border/40 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="border-t border-border/40 pt-4">
            <Skeleton className="h-2.5 w-14 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        {/* Edit form card */}
        <div className="rounded-2xl border border-border bg-card dark:border-border/30 overflow-hidden">
          <div className="border-b border-border/50 dark:border-border/25 px-6 py-5 space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-7 w-44" />
          </div>
          <div className="p-6 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className={`w-full rounded-xl ${i === 2 ? 'h-24' : 'h-10'}`} />
                <Skeleton className="h-2.5 w-48" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export function ProfileArticlesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card dark:border-border/30 p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center gap-4 pt-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileBookmarksSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="border-b border-border/50 dark:border-border/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <Skeleton className="h-2.5 w-16 mb-3" />
              <Skeleton className="h-9 w-44 mb-3" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card dark:border-border/40 overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-border/20">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
