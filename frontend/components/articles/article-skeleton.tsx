import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function ArticleHeaderSkeleton() {
  return (
    <div className="border-b bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Button variant="ghost" className="-ml-2 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-4">
          {/* Badges skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
          </div>

          {/* Title skeleton */}
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />

          {/* Description skeleton */}
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />

          {/* Featured image skeleton */}
          <Skeleton className="w-full aspect-[1200/630] rounded-[2px]" />

          {/* Meta info skeleton */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-18" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleContentSkeleton() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-6">
        {/* Paragraph skeletons */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </article>
  );
}

export function ArticleEngagementSkeleton() {
  return (
    <div className="border-t border-b bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Stats skeleton */}
        <div className="mb-6 flex items-center gap-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ArticleAuthorSkeleton() {
  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentsSectionSkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-48 mb-6" />

        {/* Comment input skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6">
          <Skeleton className="h-20 w-full mb-2" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Comment cards skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
