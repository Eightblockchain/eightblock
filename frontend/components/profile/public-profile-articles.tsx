'use client';

import { Loader2 } from 'lucide-react';
import { ArticleCard } from '@/components/articles/article-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { PublicProfileArticle } from '@/lib/api';

interface PublicProfileArticlesProps {
  articles: PublicProfileArticle[];
  isLoading: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  creatorName?: string | null;
}

export function PublicProfileArticles({
  articles,
  isLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
  creatorName,
}: PublicProfileArticlesProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, idx) => (
          <Skeleton key={idx} className="h-72 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
        <p className="text-lg font-semibold text-[#080808]">No published work yet</p>
        <p className="mt-2 text-gray-500">
          Once this creator publishes articles, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            post={{
              ...article,
              featuredImage: article.featuredImage ?? undefined,
            }}
          />
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="min-w-[200px] gap-2"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
              </>
            ) : (
              'Load more articles'
            )}
          </Button>
        </div>
      )}
    </>
  );
}
