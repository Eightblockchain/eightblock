'use client';

import { useQuery } from '@tanstack/react-query';
import { Article } from './useInfiniteArticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fetch related articles based on shared tags
 */
async function fetchRelatedArticles(articleSlug: string, limit: number = 3): Promise<Article[]> {
  const response = await fetch(`${API_URL}/articles/${articleSlug}/related?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch related articles');
  }

  return response.json();
}

interface UseRelatedArticlesOptions {
  articleSlug: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch related articles for a given article
 * Uses React Query for caching, loading states, and error handling
 */
export function useRelatedArticles({
  articleSlug,
  limit = 3,
  enabled = true,
}: UseRelatedArticlesOptions) {
  return useQuery({
    queryKey: ['related-articles', articleSlug, limit],
    queryFn: () => fetchRelatedArticles(articleSlug, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - related articles don't change often
    enabled: enabled && !!articleSlug,
  });
}
