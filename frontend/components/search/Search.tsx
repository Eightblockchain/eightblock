'use client';

import { useSearch } from '@/hooks/useSearch';
import { SearchTrigger, SearchOverlay, SearchInput, SearchHint } from './search-ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function searchArticles(query: string) {
  if (!query.trim()) return [];

  const response = await fetch(`${API_URL}/articles?limit=100`);
  if (!response.ok) throw new Error('Failed to search articles');

  const data = await response.json();
  const searchLower = query.toLowerCase();
  const words = searchLower.split(/\s+/).filter(Boolean);

  return data.articles
    .map((article: any) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const descLower = article.description.toLowerCase();
      const categoryLower = article.category?.toLowerCase() || '';

      // Title matches get highest score
      words.forEach((word) => {
        if (titleLower.includes(word)) score += 10;
        if (descLower.includes(word)) score += 5;
        if (categoryLower.includes(word)) score += 3;
        article.tags?.forEach((t: any) => {
          if (t.tag.name.toLowerCase().includes(word)) score += 7;
        });
      });

      return { article, score };
    })
    .filter(({ score }: { score: number }) => score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5)
    .map(({ article }: { article: any }) => article);
}

export default function SearchComponent() {
  const { isOpen, query, inputRef, openSearch, closeSearch, setQuery, handleSubmit } = useSearch();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchArticles(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <>
      <SearchTrigger onClick={openSearch} />

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
          <SearchOverlay onClose={closeSearch} />

          <div className="relative z-[10000] w-full max-w-2xl mx-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit} className="relative">
              <SearchInput
                value={query}
                onChange={setQuery}
                onClose={closeSearch}
                inputRef={inputRef}
              />
            </form>

            {/* Search Results Dropdown */}
            {query.length > 0 && (
              <div className="mt-2 max-h-96 overflow-y-auto rounded-lg bg-white shadow-xl">
                {query.length < 2 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Type at least 2 characters...
                  </div>
                ) : isLoading || query !== debouncedQuery ? (
                  <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                ) : results.length > 0 ? (
                  <div className="divide-y">
                    {results.map((article: any) => (
                      <Link
                        key={article.slug}
                        href={`/articles/${article.slug}`}
                        onClick={closeSearch}
                        className="block p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {article.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {article.description}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span className="rounded bg-gray-100 px-2 py-0.5">
                                {article.category}
                              </span>
                              {article.tags?.slice(0, 2).map((t: any) => (
                                <span
                                  key={t.tag.id}
                                  className="rounded bg-blue-50 px-2 py-0.5 text-blue-600"
                                >
                                  {t.tag.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/?search=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="block p-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50"
                    >
                      See all results for &ldquo;{query}&rdquo;
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No articles found for &ldquo;{query}&rdquo;
                  </div>
                )}
              </div>
            )}

            {query.length === 0 && <SearchHint />}
          </div>
        </div>
      )}
    </>
  );
}
