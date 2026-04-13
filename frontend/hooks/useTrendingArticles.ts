import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Article } from './useInfiniteArticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fetch trending articles — uses the backend score (HN gravity) ordering.
 * The backend already returns articles sorted by score DESC, so the top N
 * articles here are genuinely the highest-ranked ones right now.
 * We still filter to those with at least 1 engagement interaction so that
 * articles with zero activity don't clutter the trending rail.
 */
async function fetchTrendingArticles(limit: number = 6): Promise<Article[]> {
  const response = await fetch(`${API_URL}/articles?page=1&limit=30`);
  if (!response.ok) throw new Error('Failed to fetch trending articles');
  const data = await response.json();
  const articles: Article[] = data.articles || [];

  return articles
    .filter((a) => (a._count?.likes || 0) + (a._count?.comments || 0) > 0)
    .slice(0, limit);
}

export interface UseTrendingArticlesOptions {
  limit?: number;
  enabled?: boolean;
}

export function useTrendingArticles(options: UseTrendingArticlesOptions = {}) {
  const { limit = 6, enabled = true } = options;

  return useQuery({
    queryKey: ['trending-articles', limit],
    queryFn: () => fetchTrendingArticles(limit),
    staleTime: 0,
    refetchOnMount: 'always', // override global false — refetch on every navigation
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // poll every 30 s so trending updates in-page after likes
    enabled,
  });
}
