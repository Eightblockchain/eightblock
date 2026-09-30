import { fetcher } from '@/lib/api';

export type Interval = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface RangeQuery {
  from?: string;
  to?: string;
  interval?: Interval;
  tz: string;
}

export interface RangeInfo {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  interval: Interval;
  tz: string;
}

export const EVENT_KINDS = [
  'signups',
  'published',
  'comments',
  'claps',
  'bookmarks',
  'subscribers',
  'unsubscribes',
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export interface Summary extends Record<EventKind, number> {
  visitors: number;
  pageviews: number;
  sessions: number;
  bounceRate: number;
  avgDuration: number;
  viewsPerVisit: number;
}

export interface SeriesPoint extends Record<EventKind, number> {
  bucket: string;
  pageviews: number;
  visitors: number;
  sessions: number;
}

export interface Overview {
  range: RangeInfo;
  current: Summary;
  previous: Summary;
  series: SeriesPoint[];
  previousSeries: SeriesPoint[];
  baseline: { users: number; subscribers: number };
  totals: {
    users: number;
    usersByRole: Partial<Record<'ADMIN' | 'EDITOR' | 'WRITER' | 'READER', number>>;
    subscribers: number;
    articles: number;
    pageviews: number;
    visitors: number;
  };
}

export interface DimensionRow {
  name: string | null;
  visitors: number;
  pageviews: number;
}

export interface Breakdown {
  range: RangeInfo;
  pages: { path: string; pageviews: number; visitors: number; avgDuration: number }[];
  entryPages: { path: string; visits: number }[];
  exitPages: { path: string; visits: number }[];
  sources: { name: string; visits: number; visitors: number }[];
  referrers: { name: string; visits: number; visitors: number }[];
  campaigns: {
    campaign: string;
    source: string | null;
    medium: string | null;
    visits: number;
    visitors: number;
  }[];
  countries: DimensionRow[];
  devices: DimensionRow[];
  browsers: DimensionRow[];
  os: DimensionRow[];
  visitorTypes: { new: number; returning: number };
}

export interface ArticleStats {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  category: string;
  authorName: string | null;
  authorUsername: string | null;
  views: number;
  visitors: number;
  avgDuration: number;
  avgScroll: number;
  claps: number;
  comments: number;
  bookmarks: number;
}

export interface Content {
  range: RangeInfo;
  articles: ArticleStats[];
  topics: { name: string; slug: string; views: number; visitors: number; articles: number }[];
  authors: {
    id: string;
    name: string | null;
    username: string | null;
    views: number;
    visitors: number;
    published: number;
  }[];
}

export interface Heatmap {
  range: RangeInfo;
  cells: { day: number; hour: number; pageviews: number; visitors: number }[];
}

export interface Realtime {
  visitors: number;
  pages: { path: string; visitors: number }[];
  countries: { name: string | null; visitors: number }[];
  timeline: { minute: string; pageviews: number }[];
}

export const ACTIVITY_KINDS = [
  'signup',
  'published',
  'comment',
  'clap',
  'bookmark',
  'subscribe',
  'unsubscribe',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  at: string;
  actor: string | null;
  username: string | null;
  title: string | null;
  slug: string | null;
  detail: string | null;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: string | null;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

const report =
  <T>(path: string) =>
  (range: RangeQuery): Promise<T> =>
    fetcher(`/analytics/${path}?${query({ ...range })}`);

export const fetchOverview = report<Overview>('overview');
export const fetchBreakdown = report<Breakdown>('breakdown');
export const fetchContent = report<Content>('content');
export const fetchHeatmap = report<Heatmap>('heatmap');

export function fetchRealtime(): Promise<Realtime> {
  return fetcher('/analytics/realtime');
}

export function fetchActivity(params: {
  kinds?: ActivityKind[];
  before?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ActivityPage> {
  return fetcher(
    `/analytics/activity?${query({
      kinds: params.kinds?.join(','),
      before: params.before,
      from: params.from,
      to: params.to,
      limit: params.limit ?? 30,
    })}`
  );
}
