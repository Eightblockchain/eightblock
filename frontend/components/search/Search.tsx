'use client';

import { useSearch } from '@/hooks/useSearch';
import { SearchTrigger, SearchOverlay, SearchInput, SearchHint } from './search-ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchArticlePool() {
  const response = await fetch(`${API_URL}/articles?page=1&limit=30&status=PUBLISHED`);
  if (!response.ok) throw new Error('Failed to fetch articles');
  const data = await response.json();
  return Array.isArray(data) ? data : (data.articles ?? []);
}

function clientSearch(articles: any[], query: string) {
  if (!query.trim()) return [];
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  return articles
    .map((article: any) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const descLower = (article.description || '').toLowerCase();
      const categoryLower = (article.category || '').toLowerCase();

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

  // Fetch article pool ONCE when search opens (cached 10 min)
  const { data: articlePool = [], isLoading } = useQuery({
    queryKey: ['search-articles-pool'],
    queryFn: fetchArticlePool,
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Filter client-side
  const results = useMemo(
    () => clientSearch(articlePool, debouncedQuery),
    [articlePool, debouncedQuery]
  );

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
              <div className="mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-border/60
                bg-card shadow-2xl shadow-black/50 overflow-hidden">
                {query.length < 2 ? (
                  <div className="p-5 text-center text-[13px] text-muted-foreground/40">
                    Type at least 2 characters…
                  </div>
                ) : isLoading ? (
                  <div className="p-5 text-center text-[13px] text-muted-foreground/40">
                    Searching…
                  </div>
                ) : results.length > 0 ? (
                  <div className="divide-y divide-border/25">
                    {results.map((article: any) => (
                      <Link
                        key={article.slug}
                        href={`/articles/${article.slug}`}
                        onClick={closeSearch}
                        className="block px-5 py-4 transition-colors hover:bg-card/60 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground/90 line-clamp-1 text-[14px]
                              group-hover:text-foreground transition-colors">
                              {article.title}
                            </h3>
                            <p className="mt-1 text-[13px] text-muted-foreground/50 line-clamp-1">
                              {article.description}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5">
                              {article.category && (
                                <span className="rounded-lg border border-border/50 bg-background/60
                                  px-2 py-0.5 font-mono text-[10px] text-muted-foreground/60">
                                  {article.category}
                                </span>
                              )}
                              {article.tags?.slice(0, 2).map((t: any) => (
                                <span
                                  key={t.tag.id}
                                  className="rounded-lg border border-accent/25 bg-accent/8
                                    px-2 py-0.5 font-mono text-[10px] text-accent/80"
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
                      className="flex items-center justify-center gap-2 px-5 py-3.5
                        text-[13px] font-semibold text-primary/80 hover:text-primary
                        hover:bg-primary/5 transition-colors border-t border-border/25"
                    >
                      See all results for
                      <span className="text-primary">&ldquo;{query}&rdquo;</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-5 text-center text-[13px] text-muted-foreground/40">
                    No articles found for{' '}
                    <span className="text-foreground/60">&ldquo;{query}&rdquo;</span>
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
