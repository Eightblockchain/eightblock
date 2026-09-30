'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Loader2 } from 'lucide-react';
import { AuthGate } from '@/components/auth/auth-gate';
import { BlockCard } from '@/components/articles/block-card';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import type { Article } from '@/hooks/useInfiniteArticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchSaved(): Promise<Article[]> {
  const res = await fetch(`${API_URL}/bookmarks`, { credentials: 'include' });
  if (!res.ok) throw new Error('Could not load saved articles');
  const data = await res.json();
  return (data.bookmarks ?? []).map((bookmark: { article: Article }) => bookmark.article);
}

function SavedArticles() {
  const {
    data: articles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: fetchSaved,
  });

  return (
    <div className="container-page py-14 sm:py-16">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        Saved articles
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Articles you saved to read later. Use the Save button on any article to add it here.
      </p>

      <div className="mt-12">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-20 text-center text-sm text-muted-foreground">
            Could not load your saved articles. Refresh the page to try again.
          </p>
        )}

        {articles && articles.length === 0 && (
          <div className="border border-dashed border-border px-6 py-16 text-center">
            <Bookmark className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-4 font-medium">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When an article is worth coming back to, press Save and it will wait for you here.
            </p>
            <Link href="/writing" className="btn-pill mt-6">
              Browse articles
            </Link>
          </div>
        )}

        {articles && articles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <BlockCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <AuthGate
      title="Sign in to see your saved articles"
      description="Saved articles are stored in your account so they follow you across devices."
    >
      <SavedArticles />
    </AuthGate>
  );
}
