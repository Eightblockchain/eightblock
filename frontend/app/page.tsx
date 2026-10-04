import type { Metadata } from 'next';
import type { Article, ArticlesResponse } from '@/hooks/useInfiniteArticles';
import { siteConfig } from '@/lib/site-config';
import type { PublishedCategory } from '@/lib/categories';
import { ogImagePath, pageMetadata } from '@/lib/page-metadata';
import { NewsletterSignup } from '@/components/newsletter-signup';
import {
  FeaturedBlocks,
  Hero,
  Principles,
  StatsStrip,
  TopicsGrid,
} from '@/components/home/home-sections';

export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} | ${siteConfig.hero.titleLead} ${siteConfig.hero.titleTrail}`,
  absoluteTitle: true,
  description: siteConfig.description,
  path: '/',
  image: ogImagePath(),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HomePage() {
  const [latestRes, popularRes, stats, categories] = await Promise.all([
    fetchJson<ArticlesResponse>('/articles?page=1&limit=50&sort=latest', 60),
    fetchJson<ArticlesResponse>('/articles?page=1&limit=6&sort=score', 60),
    fetchJson<{ count: number }>('/subscriptions/stats', 300),
    fetchJson<PublishedCategory[]>('/categories', 300),
  ]);

  const latest: Article[] = latestRes?.articles ?? [];
  const popular: Article[] = popularRes?.articles ?? latest.slice(0, 6);
  const total = latestRes?.pagination?.total ?? latest.length;
  const heights = new Map(latest.map((article, i) => [article.id, total - i]));

  return (
    <>
      <Hero latest={latest} total={total} categories={categories ?? []} />
      <StatsStrip articles={latest} total={total} />
      <FeaturedBlocks articles={popular} heights={heights} total={total} />
      <TopicsGrid articles={latest} />
      <Principles />
      <section id="newsletter" className="scroll-mt-20">
        <div className="container-page py-20">
          <NewsletterSignup subscriberCount={stats?.count ?? 0} />
        </div>
      </section>
    </>
  );
}
