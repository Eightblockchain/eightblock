import { cn } from '../utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

/** Small monospace label with a status dot, used above headings. */
export function Eyebrow({ children, className, dot = true }: EyebrowProps) {
  return (
    <p className={cn('ledger-label inline-flex items-center gap-2', className)}>
      {dot && <span className="h-1.5 w-1.5 bg-brand-gold" aria-hidden="true" />}
      {children}
    </p>
  );
}

interface SectionHeaderProps {
  index?: string;
  label: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** `01 / LABEL, rule, action` followed by an optional title and description. */
export function SectionHeader({
  index,
  label,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8 sm:mb-10', className)}>
      <div className="flex items-center gap-4">
        <p className="ledger-label shrink-0">
          {index && <span className="text-brand-blue">{index}</span>}
          {index && <span className="mx-2 text-muted-foreground">/</span>}
          {label}
        </p>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {(title || description) && (
        <div className="mt-6 max-w-2xl">
          {title && (
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
