import { HomeClient } from '@/components/home/home-client';
import type { Article } from '@/hooks/useInfiniteArticles';

// Always render fresh — never serve a statically cached page
export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';

async function fetchInitialData(): Promise<{ articles: Article[]; trending: Article[] }> {
  try {
    // Single fetch for both initial articles and trending computation
    const res = await fetch(`${API_URL}/articles?page=1&limit=50`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return { articles: [], trending: [] };
    const data = await res.json();
    const all: Article[] = Array.isArray(data) ? data : (data.articles ?? []);
    const articles = all.slice(0, 10);

    // Backend already orders by score DESC — top engaged articles are first
    const trending = all
      .filter((a) => (a._count?.likes || 0) + (a._count?.comments || 0) > 0)
      .slice(0, 6);

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

