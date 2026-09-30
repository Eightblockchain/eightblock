import type { Metadata } from 'next';
import type { PublishedTopic } from '@/lib/api';
import { topicLabel, topicSlug } from '@/lib/topics';
import { pageMetadata } from '@/lib/page-metadata';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';

export interface PublicAuthor {
  id: string;
  name: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  articleCount: number;
  lastPublishedAt: string | null;
}

/** Null when the author does not exist or has no public page. */
export async function fetchPublicAuthor(username: string): Promise<PublicAuthor | null> {
  const res = await fetch(`${API_URL}/authors/${encodeURIComponent(username.toLowerCase())}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load author (${res.status})`);
  return res.json();
}

export async function fetchTopicNames(author?: string): Promise<PublishedTopic[]> {
  try {
    const query = author ? `?author=${encodeURIComponent(author)}` : '';
    const res = await fetch(`${API_URL}/articles/topics${query}`, { next: { revalidate: 300 } });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

/** Normalizes `?tag=` so "Smart Contracts", "smart-contracts" and "SMART_CONTRACTS" share one URL. */
export function tagParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const slug = raw ? topicSlug(raw) : '';
  return slug || null;
}

/** Title, description, canonical URL and a generated social card for a list page. */
export function listingMetadata({
  path,
  tag,
  title,
  description,
}: {
  path: string;
  tag: string | null;
  title: string;
  description: string;
}): Metadata {
  return pageMetadata({
    title,
    description,
    path: `${BASE_URL}${path}${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`,
  });
}

export async function tagLabel(tag: string, author?: string): Promise<string> {
  return topicLabel(tag, await fetchTopicNames(author));
}
