import { HomeClient } from '@/components/home/home-client';
import type { Article } from '@/hooks/useInfiniteArticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';

async function fetchInitialData(): Promise<{ articles: Article[]; trending: Article[] }> {
  try {
    // Single fetch for both initial articles and trending computation
    const res = await fetch(`${API_URL}/articles?page=1&limit=50`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { articles: [], trending: [] };
    const data = await res.json();
    const all: Article[] = Array.isArray(data) ? data : (data.articles ?? []);
    const articles = all.slice(0, 10);

    // Compute trending from the same set
    const now = Date.now();
    const trending = all
      .filter((a) => (a._count?.likes || 0) + (a._count?.comments || 0) > 0)
      .map((a) => {
        const days = (now - new Date(a.publishedAt).getTime()) / 86_400_000;
        const score = ((a._count?.likes || 0) + (a._count?.comments || 0) * 2) * Math.pow(0.5, days / 7);
        return { article: a, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ article }) => article);

    return { articles, trending };
  } catch {
    return { articles: [], trending: [] };
  }
}

export default async function HomePage() {
  const { articles, trending } = await fetchInitialData();
  return <HomeClient initialArticles={articles} initialTrending={trending} />;
}

// The rest of the components moved to components/home/home-client.tsx

