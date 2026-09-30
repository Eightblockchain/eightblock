import type {
  Breakdown,
  Content,
  Heatmap,
  Interval,
  Overview,
} from '@/lib/services/analytics-service';

export const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: '12m', label: 'Last 12 months' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
] as const;

export type Preset = (typeof PRESETS)[number]['id'];

export const INTERVAL_LABELS: Record<Interval, string> = {
  hour: 'Hourly',
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

const HOURS: Record<Interval, number> = { hour: 1, day: 24, week: 168, month: 730, year: 8760 };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** "2026-09-29" as local midnight. */
export function parseDay(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface ResolvedRange {
  /** Undefined means "since the first recorded activity". */
  from?: Date;
  to: Date;
}

/** Turns a preset into concrete bounds in the viewer's local time. `to` is exclusive. */
export function resolvePreset(
  preset: Preset,
  now = new Date(),
  custom?: { from?: string; to?: string }
): ResolvedRange {
  const today = startOfDay(now);
  switch (preset) {
    case 'today':
      return { from: today, to: now };
    case 'yesterday':
      return { from: addDays(today, -1), to: today };
    case '7d':
      return { from: addDays(today, -6), to: now };
    case '30d':
      return { from: addDays(today, -29), to: now };
    case '90d':
      return { from: addDays(today, -89), to: now };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case 'last-month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case '12m':
      return { from: new Date(now.getFullYear(), now.getMonth() - 11, 1), to: now };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case 'custom': {
      const from = custom?.from ? parseDay(custom.from) : null;
      const to = custom?.to ? parseDay(custom.to) : null;
      if (from && to && from <= to) return { from, to: addDays(to, 1) };
      return { from: addDays(today, -29), to: now };
    }
    case 'all':
    default:
      return { to: now };
  }
}

/** Granularities that give a readable chart for a span: at least two points, at most 400. */
export function allowedIntervals(range: ResolvedRange): Interval[] {
  if (!range.from) return ['day', 'week', 'month', 'year'];
  const hours = (range.to.getTime() - range.from.getTime()) / 3_600_000;
  return (Object.keys(HOURS) as Interval[]).filter((interval) => {
    const points = hours / HOURS[interval];
    return points <= 400 && (points >= 1.5 || interval === 'hour');
  });
}

export function defaultInterval(preset: Preset, range: ResolvedRange): Interval {
  if (preset === 'all') return 'month';
  if (preset === '12m' || preset === 'year') return 'month';
  const allowed = allowedIntervals(range);
  const hours = range.from ? (range.to.getTime() - range.from.getTime()) / 3_600_000 : Infinity;
  const pick: Interval =
    hours <= 48 ? 'hour' : hours <= 24 * 95 ? 'day' : hours <= 24 * 190 ? 'week' : 'month';
  return allowed.includes(pick) ? pick : (allowed[0] ?? 'day');
}

/** Bucket keys come back as local "YYYY-MM-DDTHH:MM". */
export function bucketDate(bucket: string): Date {
  const [date, time = '00:00'] = bucket.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

export function bucketLabel(bucket: string, interval: Interval, long = false): string {
  const date = bucketDate(bucket);
  switch (interval) {
    case 'hour':
      return long
        ? date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          })
        : date.toLocaleTimeString('en-US', { hour: 'numeric' });
    case 'day':
      return date.toLocaleDateString(
        'en-US',
        long
          ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
          : { month: 'short', day: 'numeric' }
      );
    case 'week':
      return long
        ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'month':
      return date.toLocaleDateString(
        'en-US',
        long ? { month: 'long', year: 'numeric' } : { month: 'short', year: '2-digit' }
      );
    case 'year':
      return String(date.getFullYear());
  }
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('en-US');

export function formatNumber(value: number, exact = false): string {
  if (exact || Math.abs(value) < 10_000) return whole.format(Math.round(value));
  return compact.format(value);
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Relative change; null when there is nothing to compare against. */
export function change(current: number, previous: number): number | null {
  if (!previous) return current ? Infinity : null;
  return (current - previous) / previous;
}

const regionNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export function countryName(code: string | null): string {
  if (!code) return 'Unknown';
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** 🇨🇩 from "CD". */
export function countryFlag(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function timeAgoShort(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: 'good' | 'bad' | 'neutral';
}

const DAY_NAMES = [
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
  'Sundays',
];

/** Plain-language takeaways from the numbers on screen, most useful first. */
export function buildInsights(data: {
  overview?: Overview;
  breakdown?: Breakdown;
  heatmap?: Heatmap;
  content?: Content;
}): Insight[] {
  const insights: Insight[] = [];
  const { overview, breakdown, heatmap, content } = data;

  if (overview) {
    const { current: now, previous: before } = overview;
    const delta = change(now.visitors, before.visitors);
    if (delta !== null && now.visitors + before.visitors >= 5) {
      const up = delta > 0;
      insights.push({
        id: 'trend',
        title:
          delta === Infinity
            ? 'First visitors'
            : `Visitors ${up ? 'up' : 'down'} ${formatPercent(Math.abs(delta))}`,
        body:
          delta === Infinity
            ? `${formatNumber(now.visitors)} visitors this period, with none in the period before.`
            : `${formatNumber(now.visitors)} visitors compared with ${formatNumber(before.visitors)} in the previous period of the same length.`,
        tone: delta === 0 ? 'neutral' : up ? 'good' : 'bad',
      });
    }

    const net = now.subscribers - now.unsubscribes;
    if (now.subscribers || now.unsubscribes) {
      insights.push({
        id: 'newsletter',
        title: `${net >= 0 ? '+' : ''}${formatNumber(net)} newsletter subscribers`,
        body: `${formatNumber(now.subscribers)} joined and ${formatNumber(now.unsubscribes)} left. ${formatNumber(overview.totals.subscribers)} people receive the newsletter today.`,
        tone: net > 0 ? 'good' : net < 0 ? 'bad' : 'neutral',
      });
    }

    if (now.sessions >= 20 && now.bounceRate >= 0.6) {
      insights.push({
        id: 'bounce',
        title: `${formatPercent(now.bounceRate)} of visits bounce`,
        body: 'They see one page and leave within ten seconds. Stronger intros and links to related articles help readers stay.',
        tone: 'bad',
      });
    }
  }

  if (breakdown) {
    const total = breakdown.sources.reduce((sum, s) => sum + s.visits, 0);
    const [top, second] = breakdown.sources;
    if (top && total >= 5) {
      const share = formatPercent(top.visits / total);
      const referral = top.name === 'Direct' ? second : top;
      insights.push({
        id: 'source',
        title:
          top.name === 'Direct'
            ? `${share} of visits are direct`
            : `${top.name} brings ${share} of visits`,
        body:
          top.name === 'Direct'
            ? `Typed links, bookmarks and apps that hide where readers came from.${referral ? ` The top referring source is ${referral.name} (${formatPercent(referral.visits / total)}).` : ''}`
            : 'Your strongest channel right now. Keep sharing new articles there first.',
        tone: 'neutral',
      });
    }

    const deviceTotal = breakdown.devices.reduce((sum, d) => sum + d.visitors, 0);
    const handheld = breakdown.devices
      .filter((d) => d.name === 'mobile' || d.name === 'tablet')
      .reduce((sum, d) => sum + d.visitors, 0);
    if (deviceTotal >= 10) {
      insights.push({
        id: 'mobile',
        title: `${formatPercent(handheld / deviceTotal)} read on phones or tablets`,
        body:
          handheld / deviceTotal >= 0.5
            ? 'Most readers are on small screens: check new articles on a phone before publishing.'
            : 'Most readers are on desktop.',
        tone: 'neutral',
      });
    }

    const { new: fresh, returning } = breakdown.visitorTypes;
    if (fresh + returning >= 10) {
      insights.push({
        id: 'returning',
        title: `${formatPercent(returning / (fresh + returning))} of visitors came back`,
        body: `${formatNumber(returning)} returning and ${formatNumber(fresh)} first-time visitors in this period.`,
        tone: 'neutral',
      });
    }
  }

  if (heatmap) {
    const busiest = heatmap.cells.reduce<Heatmap['cells'][number] | null>(
      (best, c) => (!best || c.pageviews > best.pageviews ? c : best),
      null
    );
    const total = heatmap.cells.reduce((sum, c) => sum + c.pageviews, 0);
    if (busiest && total >= 20) {
      const hour = new Date(2000, 0, 1, busiest.hour).toLocaleTimeString('en-US', {
        hour: 'numeric',
      });
      insights.push({
        id: 'timing',
        title: `Busiest on ${DAY_NAMES[busiest.day - 1]} around ${hour}`,
        body: 'Publishing and sharing shortly before then gives new articles the best start.',
        tone: 'neutral',
      });
    }
  }

  if (content) {
    const [top] = [...content.articles].sort((a, b) => b.views - a.views);
    if (top && top.views > 0) {
      insights.push({
        id: 'top-article',
        title: 'Most read article',
        body: `“${top.title}” with ${formatNumber(top.views)} views from ${formatNumber(top.visitors)} readers.`,
        tone: 'good',
      });
    }
    const [topic] = content.topics;
    if (topic && topic.views >= 10) {
      insights.push({
        id: 'topic',
        title: `${topic.name} is the strongest topic`,
        body: `${formatNumber(topic.views)} views across ${topic.articles} article${topic.articles === 1 ? '' : 's'}. More on this topic is likely to find an audience.`,
        tone: 'good',
      });
    }
  }

  return insights;
}

/** RFC 4180 CSV, opened directly by Excel, Numbers and Google Sheets. */
export function toCsv(rows: Record<string, string | number | null | undefined>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const cell = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((h) => cell(row[h])).join(','))].join(
    '\n'
  );
}

export function downloadCsv(
  filename: string,
  rows: Record<string, string | number | null | undefined>[]
) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
