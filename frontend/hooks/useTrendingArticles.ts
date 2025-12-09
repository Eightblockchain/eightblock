import { useQuery } from '@tanstack/react-query';
import { Article } from './useInfiniteArticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Engagement score calculation
 * Weights: likes (1x) + comments (2x) to prioritize discussion
 */
const calculateEngagementScore = (article: Article): number => {
  const likesWeight = 1;
  const commentsWeight = 2;

  const likes = article._count?.likes || 0;
  const comments = article._count?.comments || 0;

  return likes * likesWeight + comments * commentsWeight;
};

/**
 * Time decay factor for recency bias
 * Articles lose 50% relevance after 7 days
 */
const calculateTimeDecay = (publishedAt: string): number => {
  const now = new Date();
  const published = new Date(publishedAt);
  const daysSincePublished = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
  const halfLife = 7; // days

  return Math.pow(0.5, daysSincePublished / halfLife);
};

/**
 * Calculate trending score combining engagement and recency
 */
const calculateTrendingScore = (article: Article): number => {
  const engagementScore = calculateEngagementScore(article);
  const timeDecay = calculateTimeDecay(article.publishedAt);

  return engagementScore * timeDecay;
};

/**
 * Sort articles by trending score
 */
const sortByTrending = (articles: Article[]): Article[] => {
  return articles
    .map((article) => ({
      article,
      score: calculateTrendingScore(article),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article);
};

/**
 * Fetch trending articles with smart algorithm
 * - Combines engagement metrics (likes + comments)
 * - Applies time decay for recency
 * - Returns top articles by trending score
 */
async function fetchTrendingArticles(limit: number = 6): Promise<Article[]> {
  const response = await fetch(`${API_URL}/articles?limit=50`);

  if (!response.ok) {
    throw new Error('Failed to fetch articles for trending calculation');
  }

  const data = await response.json();
  const articles = data.articles || [];

  // Filter out articles with no engagement
  const articlesWithEngagement = articles.filter((article: Article) => {
    const totalEngagement = (article._count?.likes || 0) + (article._count?.comments || 0);
    return totalEngagement > 0;
  });

  // Sort by trending score and take top N
  const trending = sortByTrending(articlesWithEngagement).slice(0, limit);

  return trending;
}

export interface UseTrendingArticlesOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch and manage trending articles
 * @param options - Configuration options
 * @returns Query result with trending articles
 */
export function useTrendingArticles(options: UseTrendingArticlesOptions = {}) {
  const { limit = 6, enabled = true } = options;

  return useQuery({
    queryKey: ['trending-articles', limit],
    queryFn: () => fetchTrendingArticles(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - trending can be cached briefly
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    enabled,
  });
}

// Export utilities for testing or external use
export const trendingUtils = {
  calculateEngagementScore,
  calculateTimeDecay,
  calculateTrendingScore,
  sortByTrending,
};
