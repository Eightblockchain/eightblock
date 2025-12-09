'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPublishedArticlesPaginated } from '@/lib/api';

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
  author: {
    id: string;
    walletAddress: string;
    name: string | null;
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

export function useInfiniteArticles(limit: number = 10) {
  return useInfiniteQuery<ArticlesResponse>({
    queryKey: ['articles', 'infinite'],
    queryFn: ({ pageParam = 1 }) => getPublishedArticlesPaginated(pageParam as number, limit),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000, // 1 minute
  });
}
