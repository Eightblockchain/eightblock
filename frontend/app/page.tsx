'use client';

import { ArticleCard } from '@/components/articles/article-card';
import { useInfiniteArticles, Article } from '@/hooks/useInfiniteArticles';
import { useFeaturedArticles } from '@/hooks/useFeaturedArticles';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Hero } from '@/components/hero';
import { useSearchParams, useRouter } from 'next/navigation';

export default function HomePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArticles(10);
  const { data: featuredArticles, isLoading: featuredLoading } = useFeaturedArticles();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get('search') || '';

  const observerTarget = useRef<HTMLDivElement>(null);
  const articlesRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Flatten all pages into a single array of articles
  const allArticles = data?.pages.flatMap((page) => page.articles) ?? [];
  const featured = featuredArticles ?? [];

  // Filter articles based on search query
  const filteredArticles = searchQuery
    ? allArticles.filter((article) => {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.category?.toLowerCase().includes(query) ||
          article.tags?.some((t) => t.tag.name.toLowerCase().includes(query))
        );
      })
    : allArticles;

  const clearSearch = () => {
    router.push('/');
  };

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

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update carousel scroll buttons visibility
  const updateCarouselButtons = () => {
    const carousel = carouselRef.current;
    if (carousel) {
      setCanScrollLeft(carousel.scrollLeft > 0);
      setCanScrollRight(carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 10);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      updateCarouselButtons();
      carousel.addEventListener('scroll', updateCarouselButtons);
      return () => carousel.removeEventListener('scroll', updateCarouselButtons);
    }
  }, [featured]);

  const scrollToArticles = () => {
    articlesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const carousel = carouselRef.current;
    if (carousel) {
      const scrollAmount = carousel.clientWidth * 0.8;
      carousel.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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
      {/* Hero Section */}
      <Hero onScrollToArticles={scrollToArticles} />

      {/* Featured Articles Carousel - Only show if more than 3 featured articles and not searching */}
      {!searchQuery && !featuredLoading && featured.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-[#080808]">Featured Articles</h2>

            {featured.length <= 3 ? (
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
            ) : (
              <div className="relative">
                {/* Carousel Navigation Buttons */}
                {canScrollLeft && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50"
                    onClick={() => scrollCarousel('left')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {canScrollRight && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50"
                    onClick={() => scrollCarousel('right')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}

                {/* Scrollable Carousel */}
                <div
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {featured.map((article) => (
                    <div
                      key={article.slug}
                      className="flex-none w-full md:w-[calc(33.333%-1rem)] snap-start"
                      draggable="true"
                      onDragStart={(e) => {
                        const carousel = carouselRef.current;
                        if (carousel) {
                          const startX = e.clientX;
                          const scrollLeft = carousel.scrollLeft;
                          const handleDrag = (moveEvent: MouseEvent) => {
                            const x = moveEvent.clientX;
                            const walk = (startX - x) * 2;
                            carousel.scrollLeft = scrollLeft + walk;
                          };
                          const handleDragEnd = () => {
                            document.removeEventListener('mousemove', handleDrag);
                            document.removeEventListener('mouseup', handleDragEnd);
                          };
                          document.addEventListener('mousemove', handleDrag);
                          document.addEventListener('mouseup', handleDragEnd);
                        }
                      }}
                    >
                      <ArticleCard
                        post={
                          {
                            ...article,
                            readingTime: Math.ceil(article.content.split(' ').length / 200),
                          } as any
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Explore Articles with Infinite Scroll */}
      <section ref={articlesRef} className="py-16" id="articles">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#080808]">
              {searchQuery ? 'Search Results' : 'Explore Articles'}
            </h2>
            {searchQuery && (
              <Button variant="outline" onClick={clearSearch} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Clear Search
              </Button>
            )}
          </div>

          {searchQuery && (
            <p className="mb-6 text-sm text-gray-600">
              Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}{' '}
              matching "{searchQuery}"
            </p>
          )}

          {filteredArticles.length === 0 ? (
            <p className="text-center text-gray-600">
              {searchQuery ? `No articles found matching "${searchQuery}".` : 'No articles found.'}
            </p>
          ) : (
            <>
              <div className="space-y-6">
                {filteredArticles.map((article) => (
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

              {/* Loading indicator - only show when not searching */}
              {!searchQuery && (
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
              )}
            </>
          )}
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-[#080808] shadow-lg hover:bg-gray-800 transition-all duration-300"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
