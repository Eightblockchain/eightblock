'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { TrendingSection } from '@/components/home/trending-section';
import { ExploreSection } from '@/components/home/explore-section';
import { useInfiniteArticles } from '@/hooks/useInfiniteArticles';
import { useTrendingArticles } from '@/hooks/useTrendingArticles';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { MidnightCallout } from '@/components/home/midnight-callout';
import { useSearchParams, useRouter } from 'next/navigation';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useArticleFiltering } from '@/hooks/useArticleFiltering';
import type { Article } from '@/hooks/useInfiniteArticles';

interface HomeClientProps {
  initialArticles?: Article[];
  initialTrending?: Article[];
}

function HomePageContent({ initialArticles = [], initialTrending = [] }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  // Refs
  const observerTarget = useRef<HTMLDivElement>(null);
  const articlesRef = useRef<HTMLDivElement>(null);

  // Data fetching hooks
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteArticles(10);
  const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles({ limit: 6 });

  // Custom hooks
  const { showScrollTop, scrollToTop } = useScrollToTop(400);
  const { filteredArticles, allArticles } = useArticleFiltering(data, searchQuery);

  // Use server-provided initial data before React Query hydrates
  const displayArticles =
    allArticles.length > 0
      ? filteredArticles
      : searchQuery
        ? initialArticles.filter(
            (a) =>
              a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : initialArticles;

  const displayTrending = (trendingArticles ?? []).length > 0 ? trendingArticles! : initialTrending;

  // Handlers
  const clearSearch = () => router.push('/');
  const scrollToArticles = () => articlesRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Infinite scroll observer
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
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Error state
  if (isError && initialArticles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load articles. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!searchQuery && <HeroSection onScrollToArticles={scrollToArticles} />}
      {!searchQuery && <CategoriesSection />}

      {/* Trending Section */}
      {!searchQuery && (
        <TrendingSection
          articles={displayTrending}
          isLoading={trendingLoading && initialTrending.length === 0}
        />
      )}

      {!searchQuery && <MidnightCallout />}

      <ExploreSection
        ref={articlesRef}
        articles={displayArticles}
        allArticles={allArticles.length > 0 ? allArticles : initialArticles}
        searchQuery={searchQuery}
        isLoading={isLoading && initialArticles.length === 0}
        onClearSearch={clearSearch}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        observerTarget={observerTarget}
      />

      {showScrollTop && <ScrollToTopButton onClick={scrollToTop} />}
    </div>
  );
}

// ============================================================================
// Scroll to Top Button Component
// ============================================================================
function ScrollToTopButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-300 hover:scale-110"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

export function HomeClient({ initialArticles = [], initialTrending = [] }: HomeClientProps) {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}
    >
      <HomePageContent initialArticles={initialArticles} initialTrending={initialTrending} />
    </Suspense>
  );
}
