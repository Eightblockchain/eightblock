import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

/** "Smart Contracts" -> "smart-contracts". Tags store this as their slug. */
export function topicSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Articles belong to a topic through one of their tags or through their category
 * (older articles use categories such as "Tutorial" that are not tags).
 */
export async function topicFilter(topic: string): Promise<Prisma.ArticleWhereInput> {
  const slug = topicSlug(topic);
  const categories = await prisma.article.findMany({
    distinct: ['category'],
    select: { category: true },
  });
  const matching = categories.map((c) => c.category).filter((c) => topicSlug(c) === slug);

  return {
    OR: [
      { tags: { some: { tag: { slug } } } },
      ...(matching.length ? [{ category: { in: matching } }] : []),
    ],
  };
}

export interface Topic {
  name: string;
  slug: string;
  count: number;
}

/** Topics used by published articles (optionally one author's), most used first. */
export async function publishedTopics(where: Prisma.ArticleWhereInput): Promise<Topic[]> {
  const articles = await prisma.article.findMany({
    where: { ...where, status: 'PUBLISHED' },
    select: { category: true, tags: { select: { tag: { select: { name: true, slug: true } } } } },
  });

  const topics = new Map<string, Topic>();
  for (const article of articles) {
    const seen = new Set<string>();
    const names = [...article.tags.map((t) => t.tag.name), article.category];
    for (const name of names) {
      const slug = topicSlug(name ?? '');
      // "General" is the placeholder category for untagged articles, not a topic.
      if (!slug || slug === 'general' || seen.has(slug)) continue;
      seen.add(slug);
      const topic = topics.get(slug) ?? { name, slug, count: 0 };
      topic.count += 1;
      topics.set(slug, topic);
    }
  }

  return [...topics.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
