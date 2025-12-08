'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { ArticleCard } from '@/components/articles/article-card';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  publishedAt: string;
  author: {
    name: string | null;
    walletAddress: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

export default function BookmarksPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    // Get bookmarked article IDs from localStorage
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_articles') || '[]');

    if (bookmarks.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch all bookmarked articles
    const fetchBookmarkedArticles = async () => {
      try {
        const response = await fetch(`${API_URL}/articles?limit=100`);
        if (!response.ok) throw new Error('Failed to fetch articles');

        const data = await response.json();
        const bookmarked = data.articles.filter((article: Article) =>
          bookmarks.includes(article.id)
        );

        setBookmarkedArticles(bookmarked);
      } catch (error) {
        console.error('Error fetching bookmarked articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedArticles();
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Please connect your wallet to view your bookmarked articles
            </p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
          </div>
          <p className="text-gray-600">
            {bookmarkedArticles.length} saved article{bookmarkedArticles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {bookmarkedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Start bookmarking articles you want to read later. Click the bookmark icon on any
              article to save it here.
            </p>
            <Link href="/">
              <Button>Explore Articles</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedArticles.map((article) => (
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
        )}
      </div>
    </div>
  );
}
