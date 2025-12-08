'use client';

import { ArticleCard } from '@/components/articles/article-card';
import { useInfiniteArticles, Article } from '@/hooks/useInfiniteArticles';
import { useEffect, useRef } from 'react';

export default function HomePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArticles(10);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into a single array of articles
  const allArticles = data?.pages.flatMap((page) => page.articles) ?? [];
  const featured = allArticles.filter((article) => article.featured).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load articles. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Featured Articles - Only show if featured articles exist */}
      {featured.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-[#080808]">Featured Articles</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {featured.map((article) => (
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
          </div>
        </section>
      )}

      {/* Explore Articles with Infinite Scroll */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-[#080808]">Explore Articles</h2>
          {allArticles.length === 0 ? (
            <p className="text-center text-gray-600">No articles found.</p>
          ) : (
            <>
              <div className="space-y-6">
                {allArticles.map((article) => (
                  <div key={article.slug} className="flex gap-6 border-b pb-6 last:border-b-0">
                    <div className="flex-1">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        {article.category} ·{' '}
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        · {Math.ceil(article.content.split(' ').length / 200)} min read
                      </p>
                      <h3 className="mb-2 text-xl font-bold text-[#080808] hover:underline">
                        <a href={`/articles/${article.slug}`}>{article.title}</a>
                      </h3>
                      <p className="text-sm text-gray-600">{article.description}</p>
                    </div>
                    <div className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-400 to-purple-500">
                      {/* Image placeholder */}
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading indicator */}
              <div ref={observerTarget} className="mt-8 text-center">
                {isFetchingNextPage && (
                  <div className="inline-flex items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-gray-600">Loading more...</span>
                  </div>
                )}
                {!hasNextPage && allArticles.length > 0 && (
                  <p className="text-gray-500">You've reached the end!</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
