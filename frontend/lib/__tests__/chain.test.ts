import { describe, expect, it } from 'vitest';
import { formatBlockHeight, formatCount, readingTime, seedFrom, timeAgo } from '@/lib/chain';
import { buildTopics, topicLabel, topicSlug } from '@/lib/topics';
import type { Article } from '@/hooks/useInfiniteArticles';

describe('chain helpers', () => {
  it('formats counts compactly', () => {
    expect(formatCount(undefined)).toBe('0');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1540)).toBe('1.5k');
    expect(formatCount(2_000_000)).toBe('2M');
  });

  it('pads block heights and clamps negatives', () => {
    expect(formatBlockHeight(7)).toBe('#0007');
    expect(formatBlockHeight(-3)).toBe('#0000');
  });

  it('estimates reading time from text, ignoring markup', () => {
    expect(readingTime(null)).toBe(1);
    expect(readingTime(`<p>${'word '.repeat(660)}</p>`)).toBe(3);
  });

  it('describes elapsed time', () => {
    const now = new Date('2026-09-28T12:00:00Z');
    expect(timeAgo('2026-09-28T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-09-28T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-09-20T12:00:00Z', now)).toBe('1w ago');
    expect(timeAgo(null, now)).toBe('');
  });

  it('derives stable seeds for block patterns', () => {
    expect(seedFrom('eightblock')).toBe(seedFrom('eightblock'));
    expect(seedFrom('eightblock')).not.toBe(seedFrom('eightblocks'));
  });
});

describe('topics', () => {
  const article = (category: string, tags: string[] = []) =>
    ({ category, tags: tags.map((name) => ({ tag: { name } })) }) as unknown as Article;

  it('builds URL-safe topic slugs', () => {
    expect(topicSlug('Smart Contracts')).toBe('smart-contracts');
    expect(topicSlug('  Zero-Knowledge! ')).toBe('zero-knowledge');
    expect(topicSlug('Cardano')).toBe('cardano');
  });

  it('labels topic slugs, preferring the real name', () => {
    expect(topicLabel('defi', [{ name: 'DeFi', slug: 'defi' }])).toBe('DeFi');
    expect(topicLabel('smart-contracts')).toBe('Smart Contracts');
  });

  it('merges topics that only differ in spelling', () => {
    const topics = buildTopics(
      [article('Smart contracts', ['Smart Contracts'])],
      ['Smart Contracts']
    );
    expect(topics).toEqual([{ label: 'Smart Contracts', slug: 'smart-contracts', count: 1 }]);
  });

  it('counts each article once per topic and puts used topics first', () => {
    const topics = buildTopics(
      [article('Guide', ['Cardano', 'guide']), article('Cardano')],
      ['DeFi', 'Cardano']
    );
    expect(topics.map((t) => [t.slug, t.count])).toEqual([
      ['cardano', 2],
      ['guide', 1],
      ['defi', 0],
    ]);
  });
});
