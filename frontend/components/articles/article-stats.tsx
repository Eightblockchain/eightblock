import { cn } from '@eightblock/ui/utils';
import { formatCount } from '@/lib/chain';

interface BlockStatsProps {
  readingTime: number;
  views?: number;
  claps?: number;
  replies?: number;
  className?: string;
}

/** Four-cell data strip: READ / VIEWS / CLAPS / REPLIES. */
export function BlockStats({ readingTime, views, claps, replies, className }: BlockStatsProps) {
  const fields = [
    { label: 'Read', value: `${readingTime}m` },
    { label: 'Views', value: formatCount(views) },
    { label: 'Claps', value: formatCount(claps) },
    { label: 'Replies', value: formatCount(replies) },
  ];

  return (
    <dl className={cn('grid grid-cols-4 divide-x divide-border border-t border-border', className)}>
      {fields.map((field) => (
        <div key={field.label} className="px-3 py-2.5 sm:px-4">
          <dt className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {field.label}
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-foreground">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
