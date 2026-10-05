import { topicSlug } from '@/lib/topics';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** A blockchain an article is filed under, such as Cardano. Managed from the admin app. */
export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** How articles embed their categories, main category first. */
export interface ArticleCategoryLink {
  category: CategoryRef;
}

export interface PublishedCategory extends CategoryRef {
  description: string | null;
  /** Published articles in it. */
  count: number;
}

export async function fetchCategories(init?: RequestInit): Promise<PublishedCategory[]> {
  const res = await fetch(`${API_URL}/categories`, init);
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
  return res.json();
}

/** For server components: an empty list rather than a failed page when the API is down. */
export async function fetchCategoriesCached(): Promise<PublishedCategory[]> {
  try {
    return await fetchCategories({ next: { revalidate: 300 } });
  } catch {
    return [];
  }
}

export function categoryHref(slug: string) {
  return `/writing?category=${encodeURIComponent(slug)}`;
}

type Labelled = {
  categories?: ArticleCategoryLink[];
  tags?: Array<{ tag: { name: string } }>;
};

export function articleCategories(article: Labelled): CategoryRef[] {
  return (article.categories ?? []).map((c) => c.category);
}

/**
 * The article's main label and where it leads: its first category, or its first tag for
 * articles written before categories existed.
 */
export function primaryLabel(article: Labelled): { name: string; href: string } | null {
  const [category] = articleCategories(article);
  if (category) return { name: category.name, href: categoryHref(category.slug) };
  const tag = article.tags?.[0]?.tag.name;
  return tag ? { name: tag, href: `/writing?tag=${topicSlug(tag)}` } : null;
}

/** Chip labels for cards: the categories, or the first tag when there are none. */
export function chipLabels(article: Labelled, max = 2): string[] {
  const names = articleCategories(article).map((c) => c.name);
  if (names.length) return names.slice(0, max);
  const tag = article.tags?.[0]?.tag.name;
  return tag ? [tag] : [];
}
