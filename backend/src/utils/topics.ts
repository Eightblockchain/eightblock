import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

/** "Smart Contracts" -> "smart-contracts". Tags store this as their slug. */
export function topicSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Topics are tags; blockchains have their own filter (see categoryFilter). */
export function topicFilter(topic: string): Prisma.ArticleWhereInput {
  return { tags: { some: { tag: { slug: topicSlug(topic) } } } };
}

export function categoryFilter(slug: string): Prisma.ArticleWhereInput {
  return { categories: { some: { category: { slug } } } };
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
    select: { tags: { select: { tag: { select: { name: true, slug: true } } } } },
  });

  const topics = new Map<string, Topic>();
  for (const article of articles) {
    for (const { tag } of article.tags) {
      const topic = topics.get(tag.slug) ?? { name: tag.name, slug: tag.slug, count: 0 };
      topic.count += 1;
      topics.set(tag.slug, topic);
    }
  }

  return [...topics.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
