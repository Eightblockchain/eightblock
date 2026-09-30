'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { ChartTooltip, useChartColors } from '@/components/analytics/chart-kit';
import { formatNumber, formatPercent } from '@/lib/analytics';
import { cn } from '@eightblock/ui/utils';
import { siteHref } from '@/lib/site-config';

export interface BarRow {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Extra columns rendered before the main value, e.g. average time. */
  extra?: React.ReactNode[];
  href?: string;
  external?: boolean;
}

/** Ranked rows with a proportional bar behind each label. */
export function BarList({
  rows,
  limit,
  empty = 'Nothing recorded in this period.',
}: {
  rows: BarRow[];
  limit?: number;
  empty?: string;
}) {
  if (rows.length === 0)
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <ul className="px-2 py-2">
      {shown.map((row) => {
        const label = (
          <span className="relative z-10 flex min-w-0 items-center gap-2 truncate">
            <span className="truncate">{row.label}</span>
            {row.href && (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </span>
        );
        return (
          <li key={row.key} className="group flex items-center gap-4 px-2 py-1">
            <div className="relative min-w-0 flex-1">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-brand-blue/10 dark:bg-brand-blue/15"
                style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%` }}
                aria-hidden="true"
              />
              <div className="relative flex h-8 items-center px-2 text-sm text-foreground">
                {row.href ? (
                  row.external ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <a href={siteHref(row.href)} className="min-w-0 hover:underline">
                      {label}
                    </a>
                  )
                ) : (
                  label
                )}
              </div>
            </div>
            {row.extra?.map((cell, i) => (
              <span
                key={i}
                className="hidden w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block"
              >
                {cell}
              </span>
            ))}
            <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
              {formatNumber(row.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export interface BreakdownTab {
  id: string;
  label: string;
  column: string;
  extraColumns?: string[];
  rows: BarRow[];
  empty?: string;
}

/** A panel with tabs, column headings and a ranked list that expands in place. */
export function BreakdownPanel({
  title,
  tabs,
  limit = 8,
}: {
  title: string;
  tabs: BreakdownTab[];
  limit?: number;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const [expanded, setExpanded] = useState(false);
  const tab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <Panel marks={false} className="flex flex-col">
      <PanelBar>
        <span>{title}</span>
        {tabs.length > 1 && (
          <div role="tablist" className="flex items-center gap-3 normal-case tracking-normal">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tab.id}
                onClick={() => {
                  setActiveId(t.id);
                  setExpanded(false);
                }}
                className={cn(
                  'font-sans text-xs transition-colors',
                  t.id === tab.id
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </PanelBar>
      <div className="flex items-center gap-4 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="flex-1">{tab.label}</span>
        {tab.extraColumns?.map((c) => (
          <span key={c} className="hidden w-16 text-right sm:block">
            {c}
          </span>
        ))}
        <span className="w-14 text-right">{tab.column}</span>
      </div>
      <div className="flex-1">
        <BarList rows={tab.rows} limit={expanded ? undefined : limit} empty={tab.empty} />
      </div>
      {tab.rows.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="border-t border-border px-4 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? 'Show less' : `Show all ${tab.rows.length}`}
        </button>
      )}
    </Panel>
  );
}

/** Share of a whole, e.g. devices or new versus returning visitors. */
export function Donut({
  title,
  data,
  unit = 'visitors',
}: {
  title: string;
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const colors = useChartColors();
  const palette = [colors.blue, colors.gold, colors.deep, colors.muted, colors.foreground];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Panel marks={false}>
      <PanelBar>
        <span>{title}</span>
      </PanelBar>
      {total === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing recorded in this period.
        </p>
      ) : (
        <div className="flex items-center gap-6 p-5">
          <div className="h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((d, i) => (
                    <Cell key={d.label} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    const item = active && payload?.[0];
                    if (!item) return null;
                    const value = Number(item.value);
                    return (
                      <ChartTooltip
                        title={String(item.name)}
                        rows={[
                          {
                            label: unit,
                            value: `${formatNumber(value, true)} · ${formatPercent(value / total)}`,
                          },
                        ]}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-2">
            {data.map((d, i) => (
              <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 truncate text-foreground">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: palette[i % palette.length] }}
                  />
                  <span className="truncate capitalize">{d.label}</span>
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPercent(d.value / total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourLabel = (h: number) =>
  new Date(2000, 0, 1, h).toLocaleTimeString('en-US', { hour: 'numeric' });

/** Weekday by hour grid of page views in the viewer's timezone. */
export function ActivityHeatmap({
  cells,
}: {
  cells: { day: number; hour: number; pageviews: number; visitors: number }[];
}) {
  const grid = new Map(cells.map((c) => [`${c.day}-${c.hour}`, c]));
  const max = Math.max(...cells.map((c) => c.pageviews), 0);
  const busiest = cells.reduce<(typeof cells)[number] | null>(
    (best, c) => (!best || c.pageviews > best.pageviews ? c : best),
    null
  );

  return (
    <Panel marks={false}>
      <PanelBar>
        <span>When readers are active</span>
        {busiest && busiest.pageviews > 0 && (
          <span className="normal-case tracking-normal text-muted-foreground">
            Busiest: {DAYS[busiest.day - 1]} {hourLabel(busiest.hour)}
          </span>
        )}
      </PanelBar>
      {max === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing recorded in this period.
        </p>
      ) : (
        <div className="overflow-x-auto p-4">
          <div className="grid min-w-[640px] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center font-mono text-[9px] text-muted-foreground">
                {h % 3 === 0 ? hourLabel(h).replace(' ', '') : ''}
              </span>
            ))}
            {DAYS.map((day, d) => (
              <div key={day} className="contents">
                <span className="flex items-center font-mono text-[10px] text-muted-foreground">
                  {day}
                </span>
                {Array.from({ length: 24 }, (_, h) => {
                  const cell = grid.get(`${d + 1}-${h}`);
                  const level = cell ? cell.pageviews / max : 0;
                  return (
                    <span
                      key={h}
                      title={`${day} ${hourLabel(h)}: ${cell?.pageviews ?? 0} page views, ${cell?.visitors ?? 0} visitors`}
                      className={cn(
                        'aspect-square rounded-[2px]',
                        level === 0 ? 'bg-muted' : 'bg-brand-blue'
                      )}
                      style={level > 0 ? { opacity: 0.2 + level * 0.8 } : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 font-mono text-[10px] text-muted-foreground">
            Less
            {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <span
                key={o}
                className="h-2.5 w-2.5 rounded-[2px] bg-brand-blue"
                style={{ opacity: o }}
              />
            ))}
            More
          </div>
        </div>
      )}
    </Panel>
  );
}
