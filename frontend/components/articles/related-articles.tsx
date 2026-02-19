'use client';

import Link from 'next/link';
import { ArticleCard } from './article-card';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';
import { Loader2 } from 'lucide-react';

interface RelatedArticlesProps {
  articleSlug: string;
}

export function RelatedArticles({ articleSlug }: RelatedArticlesProps) {
  // Use React Query hook for data fetching
  const { data: relatedArticles = [], isLoading } = useRelatedArticles({
    articleSlug,
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="border-t bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Related Articles</h2>
          </div>
          <p className="text-center text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Continue your learning journey with these handpicked articles that share similar topics
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          {relatedArticles.map((article) => (
            <div key={article.id} className="h-full">
              <ArticleCard post={article} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Explore All Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
