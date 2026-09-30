'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { formatDay, INTERVAL_LABELS, PRESETS, type Preset } from '@/lib/analytics';
import type { Interval } from '@/lib/services/analytics-service';
import { cn } from '@eightblock/ui/utils';

interface RangePickerProps {
  preset: Preset;
  customFrom?: string;
  customTo?: string;
  onChange: (preset: Preset, custom?: { from: string; to: string }) => void;
}

export function RangePicker({ preset, customFrom, customTo, onChange }: RangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(customFrom ?? formatDay(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(customTo ?? formatDay(new Date()));
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !root.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const label =
    preset === 'custom' && customFrom && customTo
      ? `${customFrom} → ${customTo}`
      : (PRESETS.find((p) => p.id === preset)?.label ?? 'Last 30 days');
  const today = formatDay(new Date());

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:border-foreground/40"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {label}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-64 border border-border bg-card p-1">
          <ul role="listbox" aria-label="Date range">
            {PRESETS.filter((p) => p.id !== 'custom').map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === preset}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  {p.label}
                  {p.id === preset && <Check className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-1 space-y-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (from && to && from <= to) {
                onChange('custom', { from, to });
                setOpen(false);
              }
            }}
          >
            <p className="ledger-label">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={from}
                max={to || today}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From"
                className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
              />
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To"
                className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="btn-pill h-8 w-full text-xs"
              disabled={!from || !to || from > to}
            >
              Apply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function IntervalPicker({
  value,
  allowed,
  onChange,
}: {
  value: Interval;
  allowed: Interval[];
  onChange: (interval: Interval) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Group by"
      className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5"
    >
      {(Object.keys(INTERVAL_LABELS) as Interval[]).map((interval) => {
        const enabled = allowed.includes(interval);
        return (
          <button
            key={interval}
            type="button"
            role="radio"
            aria-checked={value === interval}
            disabled={!enabled}
            onClick={() => onChange(interval)}
            className={cn(
              'h-full rounded-[4px] px-2.5 text-xs transition-colors',
              value === interval
                ? 'bg-foreground font-medium text-background'
                : enabled
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'cursor-not-allowed text-muted-foreground/40'
            )}
          >
            {INTERVAL_LABELS[interval]}
          </button>
        );
      })}
    </div>
  );
}
