import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { getPublicProfile, PublicProfileResponse, PublicProfileArticle } from '@/lib/api';

export function usePublicProfile(walletAddress: string) {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PublicProfileResponse, Error>({
      queryKey: ['public-profile', walletAddress],
      queryFn: ({ pageParam = 1 }) => getPublicProfile(walletAddress, pageParam as number),
      initialPageParam: 1,
      enabled: !!walletAddress,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    });

  const profile = data?.pages[0]?.profile;
  const stats = profile?.stats;

  const articles = useMemo<PublicProfileArticle[]>(
    () => data?.pages.flatMap((page) => page.articles) ?? [],
    [data]
  );

  return {
    profile,
    stats,
    articles,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
