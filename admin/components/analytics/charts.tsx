'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  axisProps,
  ChartTooltip,
  EmptyChart,
  useChartColors,
  type ChartColors,
} from '@/components/analytics/chart-kit';
import { bucketLabel, formatNumber } from '@/lib/analytics';
import type { EventKind, Interval, Overview, SeriesPoint } from '@/lib/services/analytics-service';
import { cn } from '@eightblock/ui/utils';

export type TrafficMetric = 'visitors' | 'pageviews' | 'sessions';

export const TRAFFIC_LABELS: Record<TrafficMetric, string> = {
  visitors: 'Visitors',
  pageviews: 'Page views',
  sessions: 'Visits',
};

const CHART_HEIGHT = 300;

/** Traffic over time, with the previous period drawn dashed for comparison. */
export function TrafficChart({
  overview,
  metric,
  compare,
}: {
  overview: Overview;
  metric: TrafficMetric;
  compare: boolean;
}) {
  const colors = useChartColors();
  const { interval } = overview.range;
  const data = overview.series.map((point, i) => ({
    bucket: point.bucket,
    current: point[metric],
    previous: overview.previousSeries[i]?.[metric] ?? null,
    previousBucket: overview.previousSeries[i]?.bucket ?? null,
  }));

  if (overview.current[metric] === 0 && overview.previous[metric] === 0) {
    return <EmptyChart message="No traffic recorded in this period yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="0" />
        <XAxis
          dataKey="bucket"
          {...axisProps(colors)}
          tickFormatter={(b: string) => bucketLabel(b, interval)}
          minTickGap={24}
        />
        <YAxis
          {...axisProps(colors)}
          allowDecimals={false}
          tickFormatter={(v: number) => formatNumber(v)}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: colors.muted, strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            const row = active && payload?.[0]?.payload;
            if (!row) return null;
            return (
              <ChartTooltip
                title={bucketLabel(row.bucket, interval, true)}
                rows={[
                  {
                    label: TRAFFIC_LABELS[metric],
                    value: formatNumber(row.current, true),
                    color: colors.blue,
                  },
                  ...(compare && row.previousBucket
                    ? [
                        {
                          label: bucketLabel(row.previousBucket, interval, true),
                          value: formatNumber(row.previous ?? 0, true),
                          color: colors.muted,
                          muted: true,
                        },
                      ]
                    : []),
                ]}
              />
            );
          }}
        />
        {compare && (
          <Line
            dataKey="previous"
            type="monotone"
            stroke={colors.muted}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        )}
        <Area
          dataKey="current"
          type="monotone"
          stroke={colors.blue}
          strokeWidth={2}
          fill={colors.blue}
          fillOpacity={0.1}
          dot={data.length <= 2 ? { r: 3, fill: colors.blue } : false}
          activeDot={{ r: 4, fill: colors.blue, stroke: colors.card, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export const EVENT_META: Record<EventKind, { label: string; color: (c: ChartColors) => string }> = {
  signups: { label: 'Sign-ups', color: (c) => c.blue },
  subscribers: { label: 'New subscribers', color: (c) => c.deep },
  comments: { label: 'Comments', color: (c) => c.gold },
  claps: { label: 'Claps', color: (c) => c.muted },
  bookmarks: { label: 'Bookmarks', color: (c) => c.foreground },
  published: { label: 'Published', color: (c) => c.gold },
  unsubscribes: { label: 'Unsubscribes', color: (c) => c.destructive },
};

const ENGAGEMENT: EventKind[] = ['signups', 'subscribers', 'comments', 'claps', 'bookmarks'];

/** Community activity per period, stacked, with toggles per event type. */
export function EngagementChart({
  series,
  interval,
}: {
  series: SeriesPoint[];
  interval: Interval;
}) {
  const colors = useChartColors();
  const [hidden, setHidden] = useState<Set<EventKind>>(new Set());
  const visible = ENGAGEMENT.filter((k) => !hidden.has(k));
  const empty = series.every((p) => ENGAGEMENT.every((k) => p[k] === 0));

  const toggle = (kind: EventKind) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {ENGAGEMENT.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => toggle(kind)}
            aria-pressed={!hidden.has(kind)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors',
              hidden.has(kind)
                ? 'border-border text-muted-foreground line-through'
                : 'border-border text-foreground hover:border-foreground/40'
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: EVENT_META[kind].color(colors) }}
            />
            {EVENT_META[kind].label}
          </button>
        ))}
      </div>
      {empty ? (
        <EmptyChart message="No sign-ups, comments, claps, bookmarks or subscriptions in this period." />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis
              dataKey="bucket"
              {...axisProps(colors)}
              tickFormatter={(b: string) => bucketLabel(b, interval)}
              minTickGap={24}
            />
            <YAxis {...axisProps(colors)} allowDecimals={false} width={48} />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.4 }}
              content={({ active, payload }) => {
                const row = active && (payload?.[0]?.payload as SeriesPoint | undefined);
                if (!row) return null;
                return (
                  <ChartTooltip
                    title={bucketLabel(row.bucket, interval, true)}
                    rows={visible.map((k) => ({
                      label: EVENT_META[k].label,
                      value: formatNumber(row[k], true),
                      color: EVENT_META[k].color(colors),
                    }))}
                  />
                );
              }}
            />
            {visible.map((kind, i) => (
              <Bar
                key={kind}
                dataKey={kind}
                stackId="events"
                fill={EVENT_META[kind].color(colors)}
                maxBarSize={36}
                radius={i === visible.length - 1 ? [2, 2, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** Running totals: registered users and active newsletter subscribers at the end of each period. */
export function GrowthChart({ overview }: { overview: Overview }) {
  const colors = useChartColors();
  const { interval } = overview.range;
  const data = useMemo(() => {
    let users = overview.baseline.users;
    let subscribers = overview.baseline.subscribers;
    return overview.series.map((p) => {
      users += p.signups;
      subscribers += p.subscribers - p.unsubscribes;
      return { bucket: p.bucket, users, subscribers: Math.max(0, subscribers) };
    });
  }, [overview]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} />
        <XAxis
          dataKey="bucket"
          {...axisProps(colors)}
          tickFormatter={(b: string) => bucketLabel(b, interval)}
          minTickGap={24}
        />
        <YAxis
          {...axisProps(colors)}
          allowDecimals={false}
          width={48}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <Tooltip
          cursor={{ stroke: colors.muted, strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            const row = active && payload?.[0]?.payload;
            if (!row) return null;
            return (
              <ChartTooltip
                title={bucketLabel(row.bucket, interval, true)}
                rows={[
                  {
                    label: 'Registered users',
                    value: formatNumber(row.users, true),
                    color: colors.blue,
                  },
                  {
                    label: 'Newsletter subscribers',
                    value: formatNumber(row.subscribers, true),
                    color: colors.gold,
                  },
                ]}
              />
            );
          }}
        />
        <Line
          dataKey="users"
          type="stepAfter"
          stroke={colors.blue}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="subscribers"
          type="stepAfter"
          stroke={colors.gold}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
