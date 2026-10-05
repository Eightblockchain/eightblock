'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Check, Plus, Search, X } from 'lucide-react';
import {
  fetchArticlesByIds,
  searchArticles,
  type PickableArticle,
} from '@/lib/services/newsletter-service';
import { cn } from '@eightblock/ui/utils';

const MAX = 10;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function ArticlePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [known, setKnown] = useState<Record<string, PickableArticle>>({});

  useEffect(() => {
    const timer = setTimeout(() => setTerm(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const results = useQuery({
    queryKey: ['newsletter', 'articles', term],
    queryFn: () => searchArticles(term),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const missing = value.filter((id) => !known[id]);
  const selectedDetails = useQuery({
    queryKey: ['newsletter', 'articles', 'ids', missing],
    queryFn: () => fetchArticlesByIds(missing),
    enabled: missing.length > 0,
  });

  useEffect(() => {
    const found = [...(results.data ?? []), ...(selectedDetails.data ?? [])];
    if (found.length)
      setKnown((prev) => ({ ...prev, ...Object.fromEntries(found.map((a) => [a.id, a])) }));
  }, [results.data, selectedDetails.data]);

  const move = (index: number, by: number) => {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };
  const toggle = (id: string) =>
    onChange(
      value.includes(id)
        ? value.filter((v) => v !== id)
        : value.length < MAX
          ? [...value, id]
          : value
    );

  return (
    <div>
      {value.length > 0 && (
        <ol className="divide-y divide-border border border-border">
          {value.map((id, i) => {
            const article = known[id];
            return (
              <li key={id} className="flex items-center gap-3 bg-card px-3 py-2.5">
                <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {article?.title ?? 'Loading…'}
                  </p>
                  {article && (
                    <p className="truncate text-xs text-muted-foreground">
                      {i === 0 ? 'Featured · ' : ''}
                      {article.author?.name ?? 'Unknown'} · {shortDate(article.publishedAt)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={i === value.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton label="Remove" onClick={() => toggle(id)}>
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {open ? (
        <div className={cn('border border-border', value.length > 0 && 'mt-3')}>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search published articles"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {(results.data ?? []).map((article) => {
              const selected = value.includes(article.id);
              const full = !selected && value.length >= MAX;
              return (
                <li key={article.id}>
                  <button
                    type="button"
                    onClick={() => toggle(article.id)}
                    disabled={full}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 disabled:opacity-40"
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">
                        {article.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {article.category && `${article.category} · `}
                        {article.author?.name ?? 'Unknown'} · {shortDate(article.publishedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {results.data?.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No published article matches.
              </li>
            )}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={value.length >= MAX}
          className={cn('btn-pill-outline h-9 px-4 text-xs', value.length > 0 && 'mt-3')}
        >
          <Plus className="h-3.5 w-3.5" />
          {value.length ? 'Add another article' : 'Feature articles'}
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
