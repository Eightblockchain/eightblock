'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Sparkline } from '@/components/analytics/chart-kit';
import { change, formatPercent } from '@/lib/analytics';
import { cn } from '@eightblock/ui/utils';

interface KpiCardProps {
  label: string;
  value: string;
  current: number;
  previous: number;
  previousLabel: string;
  /** For metrics where lower is better, such as bounce rate. */
  invert?: boolean;
  hint?: string;
  trend?: number[];
  active?: boolean;
  onSelect?: () => void;
}

export function Delta({
  current,
  previous,
  invert = false,
}: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  const delta = change(current, previous);
  if (delta === Infinity) {
    return <span className="font-mono text-[11px] text-muted-foreground">new</span>;
  }
  if (delta === null || (delta === 0 && current === previous)) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }
  const up = delta > 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums',
        good ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(Math.abs(delta), Math.abs(delta) < 0.1 ? 1 : 0)}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  current,
  previous,
  previousLabel,
  invert,
  hint,
  trend,
  active,
  onSelect,
}: KpiCardProps) {
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      onClick={onSelect}
      aria-pressed={onSelect ? active : undefined}
      title={hint}
      className={cn(
        'relative flex flex-col bg-card p-4 text-left transition-colors',
        onSelect && 'hover:bg-muted/40',
        active && 'bg-muted/40'
      )}
    >
      {active && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-blue" aria-hidden="true" />
      )}
      <span className="ledger-label truncate">{label}</span>
      <span className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      <span className="mt-1 flex items-center gap-2">
        <Delta current={current} previous={previous} invert={invert} />
        <span className="truncate text-[11px] text-muted-foreground">{previousLabel}</span>
      </span>
      {trend && (
        <Sparkline
          values={trend}
          className={cn('mt-3', active ? 'text-brand-blue' : 'text-muted-foreground')}
        />
      )}
    </Tag>
  );
}
