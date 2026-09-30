'use client';

import Link from 'next/link';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, FileText, Loader2, PenLine, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@eightblock/ui/components/alert-dialog';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { ShareButton } from '@eightblock/ui/components/share-button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { revalidateArticle } from '@/lib/actions/revalidate-article';
import { formatBlockDate, formatCount } from '@/lib/chain';
import {
  deleteArticle,
  fetchMyArticles,
  type ArticleStatus,
  type MyArticle,
} from '@/lib/services/article-service';
import { cn } from '@eightblock/ui/utils';

const PAGE_SIZE = 20;

type Filter = 'ALL' | ArticleStatus;

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'REVIEW', label: 'In review' },
  { value: 'PUBLISHED', label: 'Published' },
];

const statusStyles: Record<ArticleStatus, { label: string; border: string; dot: string }> = {
  PUBLISHED: { label: 'Published', border: 'border-brand-blue/40', dot: 'bg-brand-blue' },
  REVIEW: { label: 'In review', border: 'border-brand-gold/60', dot: 'bg-brand-gold' },
  DRAFT: { label: 'Draft', border: 'border-border', dot: 'bg-muted-foreground' },
};

const emptyCopy: Record<Filter, { title: string; body: string }> = {
  ALL: {
    title: 'No articles yet',
    body: 'Start your first draft. It stays private until you publish it.',
  },
  DRAFT: {
    title: 'No drafts',
    body: 'Anything you save as a draft waits here until you publish it.',
  },
  REVIEW: { title: 'Nothing in review', body: 'Articles waiting for review will show up here.' },
  PUBLISHED: { title: 'Nothing published yet', body: 'Publish a draft and it will show up here.' },
};

function StatusBadge({ status }: { status: ArticleStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={cn(
        'ledger-label inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-foreground',
        style.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}

interface MyArticlesProps {
  eyebrow?: string;
}

/** The signed-in author's articles, drafts included, with filters and actions. */
export function MyArticles({ eyebrow = 'Your account' }: MyArticlesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<MyArticle | null>(null);
  const username = useCurrentUser().data?.username;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['my-articles', filter, page],
    queryFn: () =>
      fetchMyArticles({ page, limit: PAGE_SIZE, status: filter === 'ALL' ? undefined : filter }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (article: MyArticle) => deleteArticle(article.id),
    onSuccess: async (_, article) => {
      if (article.status === 'PUBLISHED')
        await revalidateArticle([article.slug]).catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      if (data && data.articles.length === 1 && page > 1) setPage((p) => p - 1);
      toast({ title: 'Article deleted', description: `"${article.title}" is gone for good.` });
    },
    onError: (error) => {
      toast({
        title: 'Could not delete the article',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    },
    onSettled: () => setPendingDelete(null),
  });

  const counts = data?.counts;
  const visibleFilters = filters.filter((f) => f.value !== 'REVIEW' || (counts?.REVIEW ?? 0) > 0);

  return (
    <div className="container-page py-14 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Your articles
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Drafts are private to you. Published articles are live for everyone.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {username && (counts?.PUBLISHED ?? 0) > 0 && (
            <>
              <Link href={`/authors/${username}`} className="btn-pill-outline">
                Public page
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <ShareButton url={`/authors/${username}`} label="Share" />
            </>
          )}
          <Link href="/articles/new" className="btn-pill">
            <PenLine className="h-4 w-4" />
            New article
          </Link>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter by status"
        className="mt-10 flex gap-6 border-b border-border"
      >
        {visibleFilters.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm transition-colors',
                active
                  ? 'border-brand-blue font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {counts && (
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {formatCount(counts[value])}
                </span>
              )}
            </button>
          );
        })}
        {isFetching && !isLoading && (
          <Loader2 className="mb-3 ml-auto h-4 w-4 self-end animate-spin text-muted-foreground" />
        )}
      </div>

      <div>
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Could not load your articles. Refresh the page to try again.
          </p>
        )}

        {data && data.articles.length === 0 && (
          <div className="mt-8 border border-dashed border-border px-6 py-16 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-4 font-medium">{emptyCopy[filter].title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyCopy[filter].body}</p>
            {filter !== 'REVIEW' && (
              <Link href="/articles/new" className="btn-pill mt-6">
                <PenLine className="h-4 w-4" />
                Write an article
              </Link>
            )}
          </div>
        )}

        {data?.articles.map((article) => {
          const isPublished = article.status === 'PUBLISHED';
          return (
            <div
              key={article.id}
              className="grid gap-3 border-b border-border py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={article.status} />
                  <span className="ledger-label">
                    {isPublished
                      ? `Published ${formatBlockDate(article.publishedAt)}`
                      : `Updated ${formatBlockDate(article.updatedAt)}`}
                  </span>
                </div>
                <Link
                  href={
                    isPublished ? `/articles/${article.slug}` : `/articles/${article.slug}/edit`
                  }
                  className="mt-2 block truncate font-display text-lg font-semibold transition-colors hover:text-brand-blue"
                >
                  {article.title}
                </Link>
                {isPublished ? (
                  <p className="ledger-label mt-1.5 normal-case tracking-normal">
                    {formatCount(article.viewCount)} views · {formatCount(article._count.likes)}{' '}
                    claps · {formatCount(article._count.comments)} replies
                  </p>
                ) : (
                  article.description && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  )
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/articles/${article.slug}/edit`} className="btn-pill-outline">
                  Edit
                </Link>
                {/* Drafts have no public page yet; the editor has a preview. */}
                {isPublished && (
                  <Link href={`/articles/${article.slug}`} className="btn-pill-outline">
                    View
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setPendingDelete(article)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                  aria-label={`Delete ${article.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="btn-pill-outline disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="ledger-label">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn-pill-outline disabled:opacity-40"
            disabled={!data.pagination.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !remove.isPending && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.status === 'PUBLISHED'
                ? `"${pendingDelete?.title}" will be removed from the site together with its claps, replies and bookmarks. This cannot be undone.`
                : `The draft "${pendingDelete?.title}" will be deleted. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete);
              }}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
