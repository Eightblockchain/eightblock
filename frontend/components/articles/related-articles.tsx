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
  const { data: relatedArticles = [], isLoading, isError } = useRelatedArticles({
    articleSlug,
    limit: 3,
  });

  if (isLoading) {
    return (
      <div className="border-t border-border/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border/20 bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex gap-0.5 items-end">
              <div className="w-0.5 h-5 bg-primary rounded-full" />
              <div className="w-0.5 h-3.5 bg-accent rounded-full" />
              <div className="w-0.5 h-2 bg-muted-foreground/20 rounded-full" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground/35">
              Continue Reading
            </span>
          </div>
          <h2 className="text-[28px] sm:text-[38px] font-black text-foreground tracking-tighter leading-none">
            Related Articles
          </h2>
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
        <div className="text-center pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-7 py-3 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
          >
            Explore All Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
