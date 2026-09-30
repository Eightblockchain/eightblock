import { cn } from '../utils';

interface CornerMarksProps {
  className?: string;
}

/** Four bracket marks sitting on a container's corners. Parent must be `relative`. */
export function CornerMarks({ className }: CornerMarksProps) {
  const base = cn('pointer-events-none absolute h-2.5 w-2.5 border-current', className);
  return (
    <>
      <span aria-hidden="true" className={cn(base, '-left-px -top-px border-l-2 border-t-2')} />
      <span aria-hidden="true" className={cn(base, '-right-px -top-px border-r-2 border-t-2')} />
      <span aria-hidden="true" className={cn(base, '-bottom-px -left-px border-b-2 border-l-2')} />
      <span aria-hidden="true" className={cn(base, '-bottom-px -right-px border-b-2 border-r-2')} />
    </>
  );
}

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  marks?: boolean;
}

/** Square bordered container with bracket corners: the base surface of the ledger UI. */
export function Panel({ className, marks = true, children, ...props }: PanelProps) {
  return (
    <div className={cn('relative border border-border bg-card', className)} {...props}>
      {marks && <CornerMarks className="text-foreground/70" />}
      {children}
    </div>
  );
}

interface PanelBarProps {
  children: React.ReactNode;
  className?: string;
}

/** Monospace header strip for a Panel. */
export function PanelBar({ children, className }: PanelBarProps) {
  return (
    <div
      className={cn(
        'ledger-label flex h-10 items-center justify-between gap-3 border-b border-border px-4',
        className
      )}
    >
      {children}
    </div>
  );
}
