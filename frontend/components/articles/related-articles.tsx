'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlockCard } from './block-card';
import { SectionHeader } from '@eightblock/ui/components/section-header';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';

interface RelatedArticlesProps {
  articleSlug: string;
}

export function RelatedArticles({ articleSlug }: RelatedArticlesProps) {
  const {
    data: relatedArticles = [],
    isLoading,
    isError,
  } = useRelatedArticles({
    articleSlug,
    limit: 3,
  });

  if (isLoading || isError || relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="container-page py-16 sm:py-20">
        <SectionHeader
          label="Next blocks"
          title="Keep reading."
          action={
            <Link
              href="/writing"
              className="ledger-label inline-flex items-center gap-1.5 transition-colors hover:text-brand-blue"
            >
              All articles
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relatedArticles.map((article) => (
            <BlockCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
