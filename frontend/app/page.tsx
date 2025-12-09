'use client';

import React, { useEffect, useRef } from 'react';
import { ArticleCard } from '@/components/articles/article-card';
import { TrendingArticleCard } from '@/components/articles/trending-article-card';
import { useInfiniteArticles } from '@/hooks/useInfiniteArticles';
import { useTrendingArticles } from '@/hooks/useTrendingArticles';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ArrowUp, ChevronLeft, ChevronRight, X, Heart, MessageCircle } from 'lucide-react';
import { Hero } from '@/components/hero';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useCarousel } from '@/hooks/useCarousel';
import { useArticleFiltering } from '@/hooks/useArticleFiltering';

export default function HomePage() {
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
  const { carouselRef, canScrollLeft, canScrollRight, scrollCarousel } = useCarousel(
    trendingArticles ?? []
  );
  const { filteredArticles, allArticles } = useArticleFiltering(data, searchQuery);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Failed to load articles. Please try again later.</p>
      </div>
    );
  }

  const trending = trendingArticles ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Hero onScrollToArticles={scrollToArticles} />

      {!searchQuery && !trendingLoading && trending.length > 0 && (
        <TrendingArticlesSection
          articles={trending}
          carouselRef={carouselRef}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollCarousel={scrollCarousel}
        />
      )}

      <ExploreArticlesSection
        ref={articlesRef}
        articles={filteredArticles}
        allArticles={allArticles}
        searchQuery={searchQuery}
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
// Trending Articles Section Component
// ============================================================================
interface TrendingArticlesSectionProps {
  articles: any[];
  carouselRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollCarousel: (direction: 'left' | 'right') => void;
}

function TrendingArticlesSection({
  articles,
  carouselRef,
  canScrollLeft,
  canScrollRight,
  onScrollCarousel,
}: TrendingArticlesSectionProps) {
  const shouldShowCarousel = articles.length > 3;

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#080808]">Trending Now</h2>
          <p className="mt-1 text-sm text-gray-600">
            Most engaging articles based on community reactions
          </p>
        </div>

        {shouldShowCarousel ? (
          <TrendingCarousel
            articles={articles}
            carouselRef={carouselRef}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollCarousel={onScrollCarousel}
          />
        ) : (
          <TrendingGrid articles={articles} />
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Trending Carousel Component
// ============================================================================
interface TrendingCarouselProps {
  articles: any[];
  carouselRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollCarousel: (direction: 'left' | 'right') => void;
}

function TrendingCarousel({
  articles,
  carouselRef,
  canScrollLeft,
  canScrollRight,
  onScrollCarousel,
}: TrendingCarouselProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

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
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50"
          onClick={() => onScrollCarousel('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white shadow-lg hover:bg-gray-50"
          onClick={() => onScrollCarousel('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className="flex-none w-full md:w-[calc(33.333%-1rem)] snap-start"
            draggable="true"
            onDragStart={handleDragStart}
          >
            <TrendingArticleCard article={article} rank={index + 1} showEngagement={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Trending Grid Component
// ============================================================================
function TrendingGrid({ articles }: { articles: any[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {articles.map((article, index) => (
        <TrendingArticleCard
          key={article.slug}
          article={article}
          rank={index + 1}
          showEngagement={true}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Explore Articles Section Component
// ============================================================================
interface ExploreArticlesSectionProps {
  articles: any[];
  allArticles: any[];
  searchQuery: string;
  onClearSearch: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  observerTarget: React.RefObject<HTMLDivElement>;
}

const ExploreArticlesSection = React.forwardRef<HTMLDivElement, ExploreArticlesSectionProps>(
  (
    {
      articles,
      allArticles,
      searchQuery,
      onClearSearch,
      hasNextPage,
      isFetchingNextPage,
      observerTarget,
    },
    ref
  ) => {
    const hasArticles = articles.length > 0;

    return (
      <section ref={ref} className="py-16" id="articles">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader searchQuery={searchQuery} onClearSearch={onClearSearch} />

          {searchQuery && <SearchResultsInfo count={articles.length} query={searchQuery} />}

          {!hasArticles ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <>
              <ArticlesList articles={articles} />

              {!searchQuery && (
                <LoadingIndicator
                  ref={observerTarget}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  hasArticles={allArticles.length > 0}
                />
              )}
            </>
          )}
        </div>
      </section>
    );
  }
);
ExploreArticlesSection.displayName = 'ExploreArticlesSection';

// ============================================================================
// Section Header Component
// ============================================================================
function SectionHeader({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-[#080808]">
        {searchQuery ? 'Search Results' : 'Explore Articles'}
      </h2>
      {searchQuery && (
        <Button variant="outline" onClick={onClearSearch} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear Search
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Search Results Info Component
// ============================================================================
function SearchResultsInfo({ count, query }: { count: number; query: string }) {
  return (
    <p className="mb-6 text-sm text-gray-600">
      Found {count} article{count !== 1 ? 's' : ''} matching "{query}"
    </p>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <p className="text-center text-gray-600">
      {searchQuery ? `No articles found matching "${searchQuery}".` : 'No articles found.'}
    </p>
  );
}

// ============================================================================
// Articles List Component
// ============================================================================
function ArticlesList({ articles }: { articles: any[] }) {
  const calculateReadingTime = (content: string) => Math.ceil(content.split(' ').length / 200);

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <ArticleListItem
          key={article.slug}
          article={article}
          readingTime={calculateReadingTime(article.content)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Article List Item Component
// ============================================================================
interface ArticleListItemProps {
  article: any;
  readingTime: number;
}

function ArticleListItem({ article, readingTime }: ArticleListItemProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const likesCount = article._count?.likes || 0;
  const commentsCount = article._count?.comments || 0;
  const authorName = article.author?.name || 'Anonymous';
  const authorAvatar = article.author?.avatarUrl || null;

  return (
    <div className="flex gap-6 border-b pb-6 last:border-b-0">
      <div className="flex-1">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          {article.category} · {formattedDate} · {readingTime} min read
        </p>
        <h3 className="mb-2 text-xl font-bold text-[#080808] hover:underline">
          <a href={`/articles/${article.slug}`}>{article.title}</a>
        </h3>
        <p className="mb-3 text-sm text-gray-600">{article.description}</p>

        {/* Author and Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Avatar src={authorAvatar} name={authorName} size="xs" />
            <span className="font-medium text-gray-700">{authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{likesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>

      <ArticleThumbnail image={article.featuredImage} title={article.title} />
    </div>
  );
}

// ============================================================================
// Article Thumbnail Component
// ============================================================================
function ArticleThumbnail({ image, title }: { image?: string; title: string }) {
  return (
    <div className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-[2px] relative">
      {image ? (
        <Image
          src={image}
          alt={title}
          width={192}
          height={128}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#080808] via-gray-900 to-black relative">
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <span className="text-sm font-semibold text-white text-center leading-tight line-clamp-3">
              {title}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Indicator Component
// ============================================================================
interface LoadingIndicatorProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  hasArticles: boolean;
}

const LoadingIndicator = React.forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  ({ isFetchingNextPage, hasNextPage, hasArticles }, ref) => {
    return (
      <div ref={ref} className="mt-8 text-center">
        {isFetchingNextPage && (
          <div className="inline-flex items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-gray-600">Loading more...</span>
          </div>
        )}
        {!hasNextPage && hasArticles && <p className="text-gray-500">You've reached the end!</p>}
      </div>
    );
  }
);
LoadingIndicator.displayName = 'LoadingIndicator';

// ============================================================================
// Scroll to Top Button Component
// ============================================================================
function ScrollToTopButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-[#080808] shadow-lg hover:bg-gray-800 transition-all duration-300"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
