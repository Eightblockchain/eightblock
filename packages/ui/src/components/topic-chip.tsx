import { cn } from '../utils';

interface TopicChipProps {
  category: string;
  className?: string;
}

export function TopicChip({ category, className }: TopicChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-muted-foreground',
        className
      )}
    >
      <span className="h-1 w-1 rounded-full bg-brand-gold" aria-hidden="true" />
      {category}
    </span>
  );
}
