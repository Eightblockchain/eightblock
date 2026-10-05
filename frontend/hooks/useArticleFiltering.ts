import { useMemo } from 'react';
import { Article } from './useInfiniteArticles';

/**
 * Hook to filter articles based on search query
 * @param data - Infinite query data with pages of articles
 * @param searchQuery - Search query string
 * @returns Filtered articles and all articles
 */
export function useArticleFiltering(
  data: { pages: { articles: Article[] }[] } | undefined,
  searchQuery: string
) {
  const allArticles = useMemo(() => data?.pages.flatMap((page) => page.articles) ?? [], [data]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return allArticles;

    const query = searchQuery.toLowerCase();
    return allArticles.filter((article) => {
      return (
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.categories?.some((c) => c.category.name.toLowerCase().includes(query)) ||
        article.tags?.some((t) => t.tag.name.toLowerCase().includes(query))
      );
    });
  }, [allArticles, searchQuery]);

  return { filteredArticles, allArticles };
}
