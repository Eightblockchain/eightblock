'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPublishedArticlesPaginated, type ArticleFilters, type ArticleSort } from '@/lib/api';

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  status: string;
  featured: boolean;
  featuredImage?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  author: {
    id: string;
    walletAddress?: string | null;
    name: string | null;
    username?: string | null;
    avatarUrl: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    likes: number;
    comments: number;
  };
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function useInfiniteArticles(
  limit: number = 10,
  sort: ArticleSort = 'score',
  filters: ArticleFilters = {}
) {
  return useInfiniteQuery<ArticlesResponse>({
    queryKey: ['articles', 'infinite', sort, limit, filters.author ?? null, filters.tag ?? null],
    queryFn: ({ pageParam = 1 }) =>
      getPublishedArticlesPaginated(pageParam as number, limit, sort, filters),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 0, // always considered stale
    refetchOnMount: 'always', // override global false: refetch when homepage mounts after navigation
    refetchOnWindowFocus: true, // also refetch when tab regains focus (handles bfcache restore)
  });
}
