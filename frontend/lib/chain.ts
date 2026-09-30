/**
 * Ledger helpers: every post is presented as a block with a height,
 * a deterministic content fingerprint and on-chain style metadata.
 * The fingerprint is a presentation hash (cyrb53), not a cryptographic proof.
 */

function cyrb53(input: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function seedFrom(input: string): number {
  return cyrb53(input, 7) >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function contentHash(input: string): string {
  const a = cyrb53(input, 1).toString(16).padStart(14, '0');
  const b = cyrb53(input, 2).toString(16).padStart(14, '0');
  const c = cyrb53(input, 3).toString(16).padStart(14, '0');
  return `0x${a}${b}${c}`.slice(0, 42);
}

export function articleHash(article: {
  slug: string;
  content?: string | null;
  publishedAt?: string | null;
}): string {
  return contentHash(`${article.slug}:${article.publishedAt ?? ''}:${article.content ?? ''}`);
}

export function formatBlockHeight(height: number): string {
  return `#${String(Math.max(0, height)).padStart(4, '0')}`;
}

export function formatCount(n?: number | null): string {
  const value = n ?? 0;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

export function readingTime(content?: string | null): number {
  if (!content) return 1;
  const words = content
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatBlockDate(date?: string | Date | null): string {
  if (!date) return '';
  return new Date(date)
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase();
}

export function timeAgo(date?: string | Date | null, now: Date = new Date()): string {
  if (!date) return '';
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 1000));
  const units: Array<[number, string]> = [
    [31_536_000, 'y'],
    [2_592_000, 'mo'],
    [604_800, 'w'],
    [86_400, 'd'],
    [3_600, 'h'],
    [60, 'm'],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return 'just now';
}
