import type { Article } from '@/hooks/useInfiniteArticles';

export interface Topic {
  label: string;
  slug: string;
  count: number;
}

/** "Smart Contracts" -> "smart-contracts". Same rule as the backend, so topic links stay stable. */
export function topicSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Display name for a topic slug: the real name when known, otherwise "smart-contracts" -> "Smart Contracts". */
export function topicLabel(slug: string, known?: { name: string; slug: string }[]): string {
  const match = known?.find((t) => t.slug === slug);
  if (match) return match.name;
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Topics = configured topics + categories actually used by posts.
 * Each post counts once per topic (by category or tag). Topics with posts come first;
 * configured topics without posts fill the remaining slots.
 */
export function buildTopics(articles: Article[], configured: string[], limit?: number): Topic[] {
  const topics = new Map<string, Topic>();
  const ensure = (label: string) => {
    const slug = topicSlug(label);
    if (slug && !topics.has(slug)) topics.set(slug, { label, slug, count: 0 });
  };

  configured.forEach(ensure);
  articles.forEach((a) => a.category && ensure(a.category));

  for (const article of articles) {
    const slugs = new Set(
      [article.category, ...(article.tags ?? []).map((t) => t.tag.name)]
        .filter(Boolean)
        .map(topicSlug)
    );
    slugs.forEach((slug) => {
      const topic = topics.get(slug);
      if (topic) topic.count += 1;
    });
  }

  const order = [...topics.keys()];
  const sorted = [...topics.values()].sort(
    (a, b) => b.count - a.count || order.indexOf(a.slug) - order.indexOf(b.slug)
  );
  const active = sorted.filter((t) => t.count > 0);
  const idle = sorted.filter(
    (t) => t.count === 0 && configured.some((c) => topicSlug(c) === t.slug)
  );
  const result = [...active, ...idle];
  return limit ? result.slice(0, limit) : result;
}
