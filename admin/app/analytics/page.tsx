'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Lightbulb, Loader2, RotateCw, TrendingDown, TrendingUp } from 'lucide-react';
import { ActivityFeed } from '@/components/analytics/activity-feed';
import {
  ActivityHeatmap,
  BreakdownPanel,
  Donut,
  type BarRow,
} from '@/components/analytics/breakdowns';
import {
  EngagementChart,
  EVENT_META,
  GrowthChart,
  TRAFFIC_LABELS,
  TrafficChart,
  type TrafficMetric,
} from '@/components/analytics/charts';
import { useChartColors } from '@/components/analytics/chart-kit';
import { ContentTable } from '@/components/analytics/content-table';
import { KpiCard } from '@/components/analytics/kpi-card';
import { IntervalPicker, RangePicker } from '@/components/analytics/range-picker';
import { RealtimeCard } from '@/components/analytics/realtime-card';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import {
  allowedIntervals,
  bucketLabel,
  buildInsights,
  countryFlag,
  countryName,
  defaultInterval,
  downloadCsv,
  formatDuration,
  formatNumber,
  formatPercent,
  PRESETS,
  resolvePreset,
  type Insight,
  type Preset,
} from '@/lib/analytics';
import {
  EVENT_KINDS,
  fetchBreakdown,
  fetchContent,
  fetchHeatmap,
  fetchOverview,
  type Breakdown,
  type Interval,
  type Overview,
  type RangeQuery,
} from '@/lib/services/analytics-service';
import { cn } from '@eightblock/ui/utils';
import { siteHref } from '@/lib/site-config';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'audience', label: 'Audience' },
  { id: 'content', label: 'Content' },
  { id: 'activity', label: 'Activity' },
] as const;
type Tab = (typeof TABS)[number]['id'];

/** Hairline grid whose partially filled last row stays card-coloured. Needs an `overflow-hidden` parent. */
const CELLS = '-mb-px -mr-px grid [&>*]:border-b [&>*]:border-r [&>*]:border-border';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "Sep 1 – 29, 2026"; `to` is exclusive, so a range ending at midnight shows the day before. */
function describe(fromIso: string, toIso: string) {
  const from = new Date(fromIso);
  const to = new Date(new Date(toIso).getTime() - 1);
  const sameDay = from.toDateString() === to.toDateString();
  if (sameDay)
    return `${dateFormat.format(from)}, ${dateTimeFormat.format(from).split(', ')[1]} – ${dateTimeFormat.format(to).split(', ')[1]}`;
  try {
    return dateFormat.formatRange(from, to);
  } catch {
    return `${dateFormat.format(from)} – ${dateFormat.format(to)}`;
  }
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <AnalyticsDashboard />
    </Suspense>
  );
}

function AnalyticsDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tick, setTick] = useState(0);
  const [metric, setMetric] = useState<TrafficMetric>('visitors');
  const [compare, setCompare] = useState(true);

  const presetParam = params.get('range') as Preset | null;
  const preset: Preset = PRESETS.some((p) => p.id === presetParam) ? presetParam! : '30d';
  const customFrom = params.get('from') ?? undefined;
  const customTo = params.get('to') ?? undefined;
  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? tabParam! : 'overview';

  const range = useMemo(
    () => resolvePreset(preset, new Date(), { from: customFrom, to: customTo }),
    // `tick` recomputes "now" when refreshing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, customFrom, customTo, tick]
  );
  const intervals = allowedIntervals(range);
  const intervalParam = params.get('interval') as Interval | null;
  const interval =
    intervalParam && intervals.includes(intervalParam)
      ? intervalParam
      : defaultInterval(preset, range);

  const query: RangeQuery = useMemo(
    () => ({
      from: range.from?.toISOString(),
      to: range.to.toISOString(),
      interval,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    [range, interval]
  );

  const setParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const search = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined) search.delete(key);
        else search.set(key, value);
      }
      router.replace(`${pathname}?${search}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const options = { placeholderData: keepPreviousData, staleTime: 60_000 };
  const overview = useQuery({
    queryKey: ['analytics', 'overview', query],
    queryFn: () => fetchOverview(query),
    ...options,
  });
  const breakdown = useQuery({
    queryKey: ['analytics', 'breakdown', query],
    queryFn: () => fetchBreakdown(query),
    ...options,
  });
  const heatmap = useQuery({
    queryKey: ['analytics', 'heatmap', query],
    queryFn: () => fetchHeatmap(query),
    ...options,
  });
  const content = useQuery({
    queryKey: ['analytics', 'content', query],
    queryFn: () => fetchContent(query),
    ...options,
  });
  const fetching =
    overview.isFetching || breakdown.isFetching || heatmap.isFetching || content.isFetching;

  const data = overview.data;
  const rangeLabel =
    preset === 'custom' && customFrom && customTo
      ? `${customFrom} to ${customTo}`
      : (PRESETS.find((p) => p.id === preset)?.label ?? '');

  const exportSeries = () => {
    if (!data) return;
    downloadCsv(
      `eightblock-analytics-${data.range.from.slice(0, 10)}-to-${data.range.to.slice(0, 10)}.csv`,
      data.series.map((p) => ({
        period: bucketLabel(p.bucket, data.range.interval, true),
        visitors: p.visitors,
        page_views: p.pageviews,
        visits: p.sessions,
        ...Object.fromEntries(EVENT_KINDS.map((k) => [k, p[k]])),
      }))
    );
  };

  return (
    <div className="container-page py-12">
      <div className="flex flex-col gap-6">
        <div>
          <Eyebrow>Analytics</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            How Eightblock is doing
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {data ? (
              <>
                {describe(data.range.from, data.range.to)}
                <span className="mx-2 text-border">|</span>
                compared with {describe(data.range.previousFrom, data.range.previousTo)}
                <span className="mx-2 text-border">|</span>
                {data.range.tz}
              </>
            ) : (
              'Loading…'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker
            preset={preset}
            customFrom={customFrom}
            customTo={customTo}
            onChange={(next, custom) =>
              setParams({ range: next, from: custom?.from, to: custom?.to, interval: undefined })
            }
          />
          <IntervalPicker
            value={interval}
            allowed={intervals}
            onChange={(i) => setParams({ interval: i })}
          />
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            aria-label="Refresh"
            title="Refresh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCw className={cn('h-4 w-4', fetching && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={exportSeries}
            disabled={!data}
            className="btn-pill-outline h-9 px-3 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Analytics sections"
        className="mt-8 flex flex-wrap gap-6 border-b border-border"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ tab: t.id === 'overview' ? undefined : t.id })}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm transition-colors',
              tab === t.id
                ? 'border-brand-blue font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {overview.isError && (
        <p className="mt-8 border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Could not load analytics. Check that you are signed in as an admin, then refresh.
        </p>
      )}

      <div className="mt-8">
        {tab === 'overview' && (
          <OverviewTab
            overview={data}
            breakdown={breakdown.data}
            insights={buildInsights({
              overview: data,
              breakdown: breakdown.data,
              heatmap: heatmap.data,
              content: content.data,
            })}
            metric={metric}
            onMetric={setMetric}
            compare={compare}
            onCompare={setCompare}
            onOpen={(t) => setParams({ tab: t })}
          />
        )}
        {tab === 'audience' && (
          <AudienceTab breakdown={breakdown.data} cells={heatmap.data?.cells} />
        )}
        {tab === 'content' && content.data && (
          <div className="space-y-6">
            <ContentTable articles={content.data.articles} rangeLabel={rangeLabel} />
            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownPanel
                title="Topics"
                tabs={[
                  {
                    id: 'topics',
                    label: 'Topic',
                    column: 'Views',
                    extraColumns: ['Readers', 'Articles'],
                    rows: content.data.topics.map((t) => ({
                      key: t.slug,
                      label: t.name,
                      value: t.views,
                      href: `/writing?tag=${t.slug}`,
                      extra: [formatNumber(t.visitors), t.articles],
                    })),
                  },
                ]}
              />
              <BreakdownPanel
                title="Writers"
                tabs={[
                  {
                    id: 'authors',
                    label: 'Writer',
                    column: 'Views',
                    extraColumns: ['Readers', 'New'],
                    rows: content.data.authors.map((a) => ({
                      key: a.id,
                      label: a.name ?? a.username ?? 'Unknown',
                      value: a.views,
                      href: a.username ? `/authors/${a.username}` : undefined,
                      extra: [formatNumber(a.visitors), a.published],
                    })),
                  },
                ]}
              />
            </div>
          </div>
        )}
        {tab === 'activity' && <ActivityFeed from={query.from} to={query.to} />}
      </div>

      <TrackingToggle />
    </div>
  );
}

function OverviewTab({
  overview,
  breakdown,
  insights,
  metric,
  onMetric,
  compare,
  onCompare,
  onOpen,
}: {
  overview?: Overview;
  breakdown?: Breakdown;
  insights: Insight[];
  metric: TrafficMetric;
  onMetric: (m: TrafficMetric) => void;
  compare: boolean;
  onCompare: (v: boolean) => void;
  onOpen: (tab: Tab) => void;
}) {
  const colors = useChartColors();
  if (!overview) return <DashboardSkeleton />;
  const { current: c, previous: p, series } = overview;
  const vs = 'vs previous';
  const trend = (key: keyof (typeof series)[number]) => series.map((s) => Number(s[key]));

  return (
    <div className="space-y-6">
      <div className="overflow-hidden border border-border bg-card">
        <div className={cn(CELLS, 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6')}>
          {(['visitors', 'pageviews', 'sessions'] as TrafficMetric[]).map((m) => (
            <KpiCard
              key={m}
              label={TRAFFIC_LABELS[m]}
              value={formatNumber(c[m])}
              current={c[m]}
              previous={p[m]}
              previousLabel={vs}
              trend={trend(m)}
              active={metric === m}
              onSelect={() => onMetric(m)}
              hint={
                m === 'visitors'
                  ? 'Unique browsers'
                  : m === 'sessions'
                    ? 'A visit ends after 30 minutes of inactivity'
                    : undefined
              }
            />
          ))}
          <KpiCard
            label="Views per visit"
            value={c.viewsPerVisit.toFixed(2)}
            current={c.viewsPerVisit}
            previous={p.viewsPerVisit}
            previousLabel={vs}
          />
          <KpiCard
            label="Bounce rate"
            value={formatPercent(c.bounceRate)}
            current={c.bounceRate}
            previous={p.bounceRate}
            previousLabel={vs}
            invert
            hint="Visits that saw one page and left within 10 seconds"
          />
          <KpiCard
            label="Visit duration"
            value={formatDuration(c.avgDuration)}
            current={c.avgDuration}
            previous={p.avgDuration}
            previousLabel={vs}
            hint="Average time a visit spent with the site open and visible"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Panel marks={false} className="lg:col-span-8">
          <PanelBar>
            <span>{TRAFFIC_LABELS[metric]} over time</span>
            <label className="flex cursor-pointer items-center gap-2 normal-case tracking-normal text-muted-foreground">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => onCompare(e.target.checked)}
                className="accent-[hsl(var(--brand-blue))]"
              />
              Compare with previous period
            </label>
          </PanelBar>
          <div className="p-4">
            <TrafficChart overview={overview} metric={metric} compare={compare} />
          </div>
        </Panel>
        <div className="lg:col-span-4">
          <RealtimeCard />
        </div>
      </div>

      {insights.length > 0 && (
        <Panel marks={false}>
          <PanelBar>
            <span className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" />
              Insights
            </span>
            <span className="normal-case tracking-normal text-muted-foreground">
              Based on this period
            </span>
          </PanelBar>
          <div className="overflow-hidden">
            <ul className={cn(CELLS, 'sm:grid-cols-2 xl:grid-cols-3')}>
              {insights.slice(0, 6).map((insight) => (
                <li key={insight.id} className="flex gap-3 p-4">
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      insight.tone === 'good'
                        ? 'border-emerald-600/30 text-emerald-700 dark:text-emerald-400'
                        : insight.tone === 'bad'
                          ? 'border-red-600/30 text-red-700 dark:text-red-400'
                          : 'border-brand-blue/40 text-foreground'
                    )}
                  >
                    {insight.tone === 'bad' ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : insight.tone === 'good' ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <Lightbulb className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {insight.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      )}

      <section className="space-y-4 pt-4">
        <h2 className="ledger-label">Community and growth</h2>
        <div className="overflow-hidden border border-border bg-card">
          <div className={cn(CELLS, 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-7')}>
            {EVENT_KINDS.map((k) => (
              <KpiCard
                key={k}
                label={EVENT_META[k].label}
                value={formatNumber(c[k])}
                current={c[k]}
                previous={p[k]}
                previousLabel={vs}
                invert={k === 'unsubscribes'}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel marks={false}>
            <PanelBar>
              <span>Engagement</span>
            </PanelBar>
            <div className="p-4">
              <EngagementChart series={series} interval={overview.range.interval} />
            </div>
          </Panel>
          <Panel marks={false}>
            <PanelBar>
              <span>Audience growth</span>
              <span className="flex items-center gap-3 normal-case tracking-normal text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors.blue }} />
                  Users
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: colors.gold }} />
                  Subscribers
                </span>
              </span>
            </PanelBar>
            <div className="p-4 pt-[3.25rem]">
              <GrowthChart overview={overview} />
            </div>
          </Panel>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PagesPanel breakdown={breakdown} />
        <SourcesPanel breakdown={breakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ActivityFeed compact from={overview.range.from} to={overview.range.to} />
          <button
            type="button"
            onClick={() => onOpen('activity')}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Open the full activity log →
          </button>
        </div>
        <Panel marks={false} className="self-start lg:col-span-5">
          <PanelBar>
            <span>All time</span>
          </PanelBar>
          <div className="overflow-hidden">
            <dl className={cn(CELLS, 'grid-cols-2')}>
              {[
                { label: 'Registered users', value: overview.totals.users },
                { label: 'Newsletter subscribers', value: overview.totals.subscribers },
                { label: 'Published articles', value: overview.totals.articles },
                {
                  label: 'Writers and editors',
                  value:
                    (overview.totals.usersByRole.WRITER ?? 0) +
                    (overview.totals.usersByRole.EDITOR ?? 0) +
                    (overview.totals.usersByRole.ADMIN ?? 0),
                },
                { label: 'Page views', value: overview.totals.pageviews },
                { label: 'Unique visitors', value: overview.totals.visitors },
              ].map((item) => (
                <div key={item.label} className="p-4">
                  <dt className="ledger-label">{item.label}</dt>
                  <dd className="mt-1.5 font-display text-xl font-semibold tabular-nums text-foreground">
                    {formatNumber(item.value, true)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PagesPanel({ breakdown }: { breakdown?: Breakdown }) {
  const pageRows = (rows: { path: string; visits: number }[]): BarRow[] =>
    rows.map((r) => ({ key: r.path, label: r.path, value: r.visits, href: r.path }));
  return (
    <BreakdownPanel
      title="Pages"
      tabs={[
        {
          id: 'top',
          label: 'Top pages',
          column: 'Views',
          extraColumns: ['Visitors', 'Time'],
          rows: (breakdown?.pages ?? []).map((r) => ({
            key: r.path,
            label: r.path,
            value: r.pageviews,
            href: r.path,
            extra: [formatNumber(r.visitors), r.avgDuration ? formatDuration(r.avgDuration) : '–'],
          })),
        },
        {
          id: 'entry',
          label: 'Landing',
          column: 'Visits',
          rows: pageRows(breakdown?.entryPages ?? []),
        },
        { id: 'exit', label: 'Exit', column: 'Visits', rows: pageRows(breakdown?.exitPages ?? []) },
      ]}
    />
  );
}

function SourcesPanel({ breakdown }: { breakdown?: Breakdown }) {
  return (
    <BreakdownPanel
      title="Traffic sources"
      tabs={[
        {
          id: 'sources',
          label: 'Sources',
          column: 'Visits',
          rows: (breakdown?.sources ?? []).map((s) => ({
            key: s.name,
            label: s.name,
            value: s.visits,
          })),
        },
        {
          id: 'referrers',
          label: 'Referrers',
          column: 'Visits',
          empty: 'No other sites linked to you in this period.',
          rows: (breakdown?.referrers ?? []).map((r) => ({
            key: r.name,
            label: r.name,
            value: r.visits,
            href: `https://${r.name}`,
            external: true,
          })),
        },
        {
          id: 'campaigns',
          label: 'Campaigns',
          column: 'Visits',
          empty:
            'Add ?utm_campaign=name to links you share to track campaigns here. Newsletter links are tagged automatically.',
          rows: (breakdown?.campaigns ?? []).map((c) => ({
            key: `${c.campaign}-${c.source}-${c.medium}`,
            label: `${c.campaign}${c.source ? ` · ${c.source}` : ''}${c.medium ? ` / ${c.medium}` : ''}`,
            value: c.visits,
          })),
        },
      ]}
    />
  );
}

function AudienceTab({
  breakdown,
  cells,
}: {
  breakdown?: Breakdown;
  cells?: { day: number; hour: number; pageviews: number; visitors: number }[];
}) {
  if (!breakdown) return <DashboardSkeleton />;
  const dimension = (
    rows: Breakdown['devices'],
    format?: (name: string | null) => string
  ): BarRow[] =>
    rows.map((r) => ({
      key: r.name ?? 'unknown',
      label: format ? format(r.name) : (r.name ?? 'Unknown'),
      value: r.visitors,
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SourcesPanel breakdown={breakdown} />
        <BreakdownPanel
          title="Locations"
          tabs={[
            {
              id: 'countries',
              label: 'Country',
              column: 'Visitors',
              rows: dimension(
                breakdown.countries,
                (code) => `${countryFlag(code)}  ${countryName(code)}`
              ),
            },
          ]}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Donut
          title="Devices"
          data={breakdown.devices.map((d) => ({ label: d.name ?? 'unknown', value: d.visitors }))}
        />
        <Donut
          title="New and returning"
          data={[
            { label: 'new', value: breakdown.visitorTypes.new },
            { label: 'returning', value: breakdown.visitorTypes.returning },
          ].filter((d) => d.value > 0)}
        />
        <BreakdownPanel
          title="Technology"
          limit={6}
          tabs={[
            {
              id: 'browsers',
              label: 'Browser',
              column: 'Visitors',
              rows: dimension(breakdown.browsers),
            },
            { id: 'os', label: 'System', column: 'Visitors', rows: dimension(breakdown.os) },
          ]}
        />
      </div>
      <ActivityHeatmap cells={cells ?? []} />
      <PagesPanel breakdown={breakdown} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-px border border-border bg-border sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[132px] animate-pulse bg-card" />
        ))}
      </div>
      <div className="h-[360px] animate-pulse border border-border bg-muted/40" />
    </div>
  );
}

/**
 * Lets the team keep their own browsing out of the numbers. The preference lives in the blog's
 * storage, so these links open the blog with a flag its page tracker saves and then removes.
 */
function TrackingToggle() {
  const link = 'font-medium text-foreground underline underline-offset-4 hover:text-brand-blue';
  return (
    <p className="mt-10 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Keep your own visits out of the numbers.</span>{' '}
      <a href={siteHref('/?eb_analytics=off')} target="_blank" rel="noreferrer" className={link}>
        Exclude this browser
      </a>{' '}
      or{' '}
      <a href={siteHref('/?eb_analytics=on')} target="_blank" rel="noreferrer" className={link}>
        count it again
      </a>
      . Do this once in each browser you read the site with. No IP addresses are stored; visitors
      are counted with an anonymous cookie.
    </p>
  );
}
