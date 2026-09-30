'use client';

import { useQuery } from '@tanstack/react-query';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { countryFlag, countryName, formatNumber } from '@/lib/analytics';
import { fetchRealtime } from '@/lib/services/analytics-service';

/** Visitors active in the last five minutes, refreshed every 15 seconds. */
export function RealtimeCard() {
  const { data } = useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: fetchRealtime,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
  const max = Math.max(...(data?.timeline.map((t) => t.pageviews) ?? [0]), 1);
  const lastHalfHour = data?.timeline.reduce((sum, t) => sum + t.pageviews, 0) ?? 0;

  return (
    <Panel marks={false} className="flex flex-col">
      <PanelBar>
        <span className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!!data?.visitors && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
          </span>
          Live
        </span>
        <span className="normal-case tracking-normal text-muted-foreground">Last 5 minutes</span>
      </PanelBar>
      <div className="p-5">
        <p className="font-display text-4xl font-semibold tabular-nums text-foreground">
          {data ? formatNumber(data.visitors, true) : '–'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.visitors === 1
            ? 'visitor on the site right now'
            : 'visitors on the site right now'}
        </p>

        <div
          className="mt-5 flex h-12 items-end gap-[3px]"
          aria-label={`${lastHalfHour} page views in the last 30 minutes`}
        >
          {(
            data?.timeline ??
            Array.from({ length: 30 }, (_, i) => ({ minute: String(i), pageviews: 0 }))
          ).map((t) => (
            <span
              key={t.minute}
              title={`${new Date(t.minute).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}: ${t.pageviews} page views`}
              className={t.pageviews ? 'flex-1 rounded-t-[1px] bg-brand-blue' : 'flex-1 bg-muted'}
              style={{ height: `${t.pageviews ? Math.max((t.pageviews / max) * 100, 8) : 6}%` }}
            />
          ))}
        </div>
        <p className="ledger-label mt-2">
          {formatNumber(lastHalfHour, true)} page views · last 30 minutes
        </p>
      </div>

      {data && (data.pages.length > 0 || data.countries.length > 0) && (
        <div className="border-t border-border px-5 py-4">
          <p className="ledger-label mb-2">Reading now</p>
          <ul className="space-y-1.5">
            {data.pages.slice(0, 4).map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{p.path}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {p.visitors}
                </span>
              </li>
            ))}
          </ul>
          {data.countries.length > 0 && (
            <p className="mt-3 truncate text-xs text-muted-foreground">
              {data.countries
                .map((c) => `${countryFlag(c.name)} ${countryName(c.name)}`)
                .join('  ·  ')}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
