'use client';

import { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Layers, Loader2 } from 'lucide-react';
import { cn } from '@eightblock/ui/utils';
import { fetchCategories, type CategoryRef } from '@/lib/categories';

export const MAX_CATEGORIES = 5;

interface CategoryPickerProps {
  /** Selected ids in the order they were picked; the first is the main category. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Highlights the picker after a publish attempt without a category. */
  invalid?: boolean;
  /** Categories the article already has, shown even if the list fails to load. */
  initial?: CategoryRef[];
}

export function useCategoryList() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories({ cache: 'no-store' }),
    staleTime: 5 * 60_000,
  });
}

/** Blockchain picker shown first in the editor. Multi-select, in pick order. */
export const CategoryPicker = forwardRef<HTMLDivElement, CategoryPickerProps>(
  function CategoryPicker({ value, onChange, invalid, initial = [] }, ref) {
    const { data, isLoading, isError, refetch, isFetching } = useCategoryList();
    const known = new Map((data ?? initial).map((c) => [c.id, c]));
    const options = data ?? initial;
    const full = value.length >= MAX_CATEGORIES;

    const toggle = (id: string) =>
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

    return (
      <section
        ref={ref}
        aria-labelledby="category-picker-label"
        className={cn(
          'mb-4 scroll-mt-24 rounded-2xl border bg-card px-6 py-5 transition-colors',
          invalid ? 'border-destructive/70' : 'border-border'
        )}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary/70" />
            <span
              id="category-picker-label"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70"
            >
              Blockchain
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {value.length > 1
              ? `Main: ${known.get(value[0])?.name ?? '…'}. Unselect it to promote the next one.`
              : 'Pick one or more. Required to publish.'}
          </p>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-labelledby="category-picker-label"
        >
          {isLoading && !options.length && (
            <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading categories…
            </span>
          )}

          {options.map((category) => {
            const position = value.indexOf(category.id);
            const selected = position !== -1;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                disabled={!selected && full}
                onClick={() => toggle(category.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  selected
                    ? 'border-brand-blue bg-brand-blue/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5 text-brand-blue" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
                )}
                {category.name}
                {selected && value.length > 1 && (
                  <span className="font-mono text-[10px] text-brand-blue">{position + 1}</span>
                )}
              </button>
            );
          })}

          {!isLoading && !isError && data?.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              No categories yet. An admin needs to add one before articles can be published.
            </p>
          )}
        </div>

        {isError && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Could not load the categories.{' '}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Try again
            </button>
          </p>
        )}

        {invalid && value.length === 0 && (
          <p className="mt-3 text-[13px] text-destructive" role="alert">
            Pick at least one blockchain before publishing.
          </p>
        )}
      </section>
    );
  }
);
