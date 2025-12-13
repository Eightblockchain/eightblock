'use client';

import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/lib/wallet-context';
import { ArticleCard } from '@/components/articles/article-card';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { ProfileBookmarksSkeleton } from '@/components/profile/profile-skeleton';
import { fetchBookmarkedArticles, ArticleSummary } from '@/lib/article-api';

export default function BookmarksPage() {
  const { address } = useWallet();
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

  if (!address) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Please connect your wallet to view your bookmarked articles
            </p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <ProfileBookmarksSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <p className="text-red-600">
            {(error as Error)?.message || 'Failed to load your bookmarks. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
          </div>
          <p className="text-gray-600">
            {bookmarkedArticles.length} saved article{bookmarkedArticles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {bookmarkedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Start bookmarking articles you want to read later. Click the bookmark icon on any
              article to save it here.
            </p>
            <Link href="/">
              <Button>Explore Articles</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                post={
                  {
                    ...article,
                    readingTime: Math.ceil(article.content.split(' ').length / 200),
                  } as any
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
