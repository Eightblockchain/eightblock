'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@eightblock/ui/utils';

export interface ChartColors {
  blue: string;
  gold: string;
  foreground: string;
  muted: string;
  grid: string;
  card: string;
  deep: string;
  destructive: string;
}

const FALLBACK: ChartColors = {
  blue: 'hsl(199 78% 48%)',
  gold: 'hsl(43 97% 55%)',
  foreground: 'hsl(222 32% 9%)',
  muted: 'hsl(220 9% 43%)',
  grid: 'hsl(220 14% 89%)',
  card: 'hsl(0 0% 100%)',
  deep: 'hsl(205 70% 32%)',
  destructive: 'hsl(0 72% 51%)',
};

/** SVG attributes cannot read CSS variables reliably, so resolve the theme tokens to colors. */
export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(FALLBACK);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const token = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`;
    const dark = document.documentElement.classList.contains('dark');
    setColors({
      blue: token('--brand-blue'),
      gold: token('--brand-gold'),
      foreground: token('--foreground'),
      muted: token('--muted-foreground'),
      grid: token('--border'),
      card: token('--card'),
      deep: dark ? 'hsl(199 45% 72%)' : 'hsl(205 70% 30%)',
      destructive: token('--destructive'),
    });
  }, [resolvedTheme]);

  return colors;
}

export const axisProps = (colors: ChartColors) => ({
  stroke: colors.grid,
  tick: { fill: colors.muted, fontSize: 11, fontFamily: 'var(--font-mono)' },
  tickLine: false,
  axisLine: false,
});

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  muted?: boolean;
}

/** Tooltip body shared by every chart: a small ledger panel. */
export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-[180px] border border-border bg-card px-3 py-2.5 text-xs">
      <p className="ledger-label mb-2">{title}</p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-6">
            <span
              className={cn(
                'flex items-center gap-2',
                row.muted ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {row.color && (
                <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
              )}
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tiny trend line for KPI cards. Draws with currentColor. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return <div className={cn('h-8', className)} />;
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  const points = values.map(
    (v, i) => `${(i * step).toFixed(2)},${(30 - (v / max) * 26).toFixed(2)}`
  );
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
      aria-hidden="true"
    >
      <polygon points={`0,32 ${points.join(' ')} 100,32`} fill="currentColor" opacity={0.08} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function EmptyChart({ message = 'No data for this period yet.' }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}
