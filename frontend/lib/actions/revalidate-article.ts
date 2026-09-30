'use server';

import { revalidatePath } from 'next/cache';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUGS = 5;
const MIN_INTERVAL_MS = 5_000;

// Server actions are public endpoints and the API session cookie is not visible here, so repeat
// calls are throttled per path to stop anyone from forcing constant re-renders.
const lastRevalidated = new Map<string, number>();

function revalidateThrottled(path: string) {
  const now = Date.now();
  if (now - (lastRevalidated.get(path) ?? 0) < MIN_INTERVAL_MS) return;
  lastRevalidated.set(path, now);
  if (lastRevalidated.size > 1000) {
    for (const [key, at] of lastRevalidated) {
      if (now - at >= MIN_INTERVAL_MS) lastRevalidated.delete(key);
    }
  }
  revalidatePath(path);
}

// Article pages are cached for an hour; refresh them as soon as the author saves, so a published
// draft or an edit shows up immediately instead of the cached 404 or old content.
export async function revalidateArticle(slugs: string[]) {
  if (!Array.isArray(slugs)) return;
  const valid = [...new Set(slugs)]
    .filter((slug) => typeof slug === 'string' && SLUG.test(slug))
    .slice(0, MAX_SLUGS);
  for (const slug of valid) revalidateThrottled(`/articles/${slug}`);
  revalidateThrottled('/');
  revalidateThrottled('/writing');
}
