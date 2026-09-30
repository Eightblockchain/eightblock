import { describe, expect, it } from 'vitest';
import {
  allowedIntervals,
  bucketLabel,
  buildInsights,
  change,
  countryFlag,
  defaultInterval,
  formatDuration,
  formatNumber,
  resolvePreset,
  toCsv,
} from '@/lib/analytics';
import type {
  Breakdown,
  Content,
  Heatmap,
  Overview,
  Summary,
} from '@/lib/services/analytics-service';

const now = new Date(2026, 8, 29, 15, 30);

describe('resolvePreset', () => {
  it('builds local ranges with an exclusive end', () => {
    expect(resolvePreset('today', now)).toEqual({ from: new Date(2026, 8, 29), to: now });
    expect(resolvePreset('yesterday', now)).toEqual({
      from: new Date(2026, 8, 28),
      to: new Date(2026, 8, 29),
    });
    expect(resolvePreset('7d', now).from).toEqual(new Date(2026, 8, 23));
    expect(resolvePreset('last-month', now)).toEqual({
      from: new Date(2026, 7, 1),
      to: new Date(2026, 8, 1),
    });
    expect(resolvePreset('12m', now).from).toEqual(new Date(2025, 9, 1));
    expect(resolvePreset('all', now)).toEqual({ to: now });
  });

  it('includes the whole last day of a custom range and rejects bad input', () => {
    expect(resolvePreset('custom', now, { from: '2026-01-01', to: '2026-01-31' })).toEqual({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 1, 1),
    });
    expect(resolvePreset('custom', now, { from: '2026-02-01', to: '2026-01-01' }).from).toEqual(
      new Date(2026, 7, 31)
    );
    expect(resolvePreset('custom', now, { from: 'nope', to: '2026-01-01' }).to).toBe(now);
  });
});

describe('intervals', () => {
  it('only offers readable granularities', () => {
    expect(allowedIntervals(resolvePreset('today', now))).toEqual(['hour']);
    expect(allowedIntervals(resolvePreset('30d', now))).toEqual(['day', 'week']);
    expect(allowedIntervals(resolvePreset('7d', now))).toEqual(['hour', 'day']);
    expect(allowedIntervals(resolvePreset('12m', now))).toEqual(['day', 'week', 'month']);
    expect(allowedIntervals({ to: now })).toEqual(['day', 'week', 'month', 'year']);
  });

  it('picks a sensible default', () => {
    expect(defaultInterval('today', resolvePreset('today', now))).toBe('hour');
    expect(defaultInterval('30d', resolvePreset('30d', now))).toBe('day');
    expect(defaultInterval('12m', resolvePreset('12m', now))).toBe('month');
    expect(defaultInterval('all', { to: now })).toBe('month');
  });
});

describe('formatting', () => {
  it('formats numbers, durations and changes', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(15_300)).toBe('15.3K');
    expect(formatNumber(15_300, true)).toBe('15,300');
    expect(formatDuration(42)).toBe('42s');
    expect(formatDuration(125)).toBe('2m 05s');
    expect(formatDuration(3_900)).toBe('1h 05m');
    expect(change(150, 100)).toBe(0.5);
    expect(change(5, 0)).toBe(Infinity);
    expect(change(0, 0)).toBeNull();
  });

  it('labels buckets and builds flags', () => {
    expect(bucketLabel('2026-09-01T00:00', 'day')).toBe('Sep 1');
    expect(bucketLabel('2026-09-01T00:00', 'month', true)).toBe('September 2026');
    expect(bucketLabel('2026-01-01T00:00', 'year')).toBe('2026');
    expect(countryFlag('CD')).toBe('🇨🇩');
    expect(countryFlag(null)).toBe('🌐');
  });

  it('escapes CSV cells', () => {
    expect(toCsv([{ title: 'Hello, "world"', views: 3 }])).toBe(
      'title,views\n"Hello, ""world""",3'
    );
  });
});

const summary = (values: Partial<Summary>): Summary => ({
  visitors: 0,
  pageviews: 0,
  sessions: 0,
  bounceRate: 0,
  avgDuration: 0,
  viewsPerVisit: 0,
  signups: 0,
  published: 0,
  comments: 0,
  claps: 0,
  bookmarks: 0,
  subscribers: 0,
  unsubscribes: 0,
  ...values,
});

describe('buildInsights', () => {
  const overview = {
    current: summary({
      visitors: 150,
      sessions: 200,
      bounceRate: 0.7,
      subscribers: 12,
      unsubscribes: 2,
    }),
    previous: summary({ visitors: 100 }),
    totals: { subscribers: 340 },
  } as Overview;
  const breakdown = {
    sources: [
      { name: 'Direct', visits: 60, visitors: 50 },
      { name: 'Google', visits: 40, visitors: 35 },
    ],
    devices: [
      { name: 'mobile', visitors: 60, pageviews: 80 },
      { name: 'desktop', visitors: 40, pageviews: 70 },
    ],
    visitorTypes: { new: 70, returning: 30 },
  } as Breakdown;
  const heatmap = {
    cells: [
      { day: 2, hour: 14, pageviews: 40, visitors: 20 },
      { day: 5, hour: 9, pageviews: 10, visitors: 8 },
    ],
  } as Heatmap;
  const content = {
    articles: [
      { title: 'Staking basics', views: 30, visitors: 25 },
      { title: 'Plutus deep dive', views: 90, visitors: 70 },
    ],
    topics: [{ name: 'Cardano', slug: 'cardano', views: 120, visitors: 90, articles: 2 }],
  } as Content;

  it('turns the numbers into takeaways', () => {
    const insights = buildInsights({ overview, breakdown, heatmap, content });
    const byId = Object.fromEntries(insights.map((i) => [i.id, i]));

    expect(byId.trend).toMatchObject({ title: 'Visitors up 50%', tone: 'good' });
    expect(byId.newsletter.title).toBe('+10 newsletter subscribers');
    expect(byId.bounce.title).toBe('70% of visits bounce');
    expect(byId.source.title).toBe('60% of visits are direct');
    expect(byId.source.body).toContain('Google (40%)');
    expect(byId.mobile.title).toBe('60% read on phones or tablets');
    expect(byId.returning.title).toBe('30% of visitors came back');
    expect(byId.timing.title).toBe('Busiest on Tuesdays around 2 PM');
    expect(byId['top-article'].body).toContain('Plutus deep dive');
    expect(byId.topic.title).toBe('Cardano is the strongest topic');
  });

  it('stays quiet when there is too little data', () => {
    const quiet = buildInsights({
      overview: {
        ...overview,
        current: summary({ visitors: 1 }),
        previous: summary({}),
      } as Overview,
      breakdown: {
        ...breakdown,
        sources: [{ name: 'Direct', visits: 1, visitors: 1 }],
        devices: [],
        visitorTypes: { new: 1, returning: 0 },
      },
      heatmap: { cells: [] } as unknown as Heatmap,
    });
    expect(quiet).toEqual([]);
  });
});
