import { cn } from '../utils';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  count?: { value: number; max: number };
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, count, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {count && (
          <span
            className={cn(
              'font-mono text-[11px] tabular-nums',
              count.value > count.max ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Titled block used to group fields on settings-style pages. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-border py-10 first-of-type:border-t-0 first-of-type:pt-0 last-of-type:pb-0 md:grid-cols-3 md:gap-10">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-6 md:col-span-2">{children}</div>
    </section>
  );
}
