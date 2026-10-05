'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { downloadCsv, formatDuration, formatNumber } from '@/lib/analytics';
import type { ArticleStats } from '@/lib/services/analytics-service';
import { cn } from '@eightblock/ui/utils';
import { siteHref } from '@/lib/site-config';

type SortKey =
  | 'title'
  | 'views'
  | 'visitors'
  | 'avgDuration'
  | 'avgScroll'
  | 'claps'
  | 'comments'
  | 'bookmarks'
  | 'engagement';

const COLUMNS: { key: SortKey; label: string; hint?: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'visitors', label: 'Readers', hint: 'Unique visitors' },
  { key: 'avgDuration', label: 'Read time', hint: 'Average time the article was open and visible' },
  { key: 'avgScroll', label: 'Scrolled', hint: 'Average share of the article scrolled' },
  { key: 'claps', label: 'Claps' },
  { key: 'comments', label: 'Replies' },
  { key: 'bookmarks', label: 'Saves' },
  { key: 'engagement', label: 'Engaged', hint: 'Claps, replies and saves per 100 readers' },
];

const engagement = (a: ArticleStats) =>
  a.visitors ? ((a.claps + a.comments + a.bookmarks) / a.visitors) * 100 : 0;

export function ContentTable({
  articles,
  rangeLabel,
}: {
  articles: ArticleStats[];
  rangeLabel: string;
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'views', desc: true });
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter(
          (a) => a.title.toLowerCase().includes(q) || a.authorName?.toLowerCase().includes(q)
        )
      : articles;
    const value = (a: ArticleStats) => (sort.key === 'engagement' ? engagement(a) : a[sort.key]);
    return [...filtered].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const order = typeof x === 'string' ? x.localeCompare(String(y)) : Number(x) - Number(y);
      return sort.desc ? -order : order;
    });
  }, [articles, query, sort]);

  const shown = showAll ? rows : rows.slice(0, 15);
  const toggle = (key: SortKey) =>
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'title' }));

  const exportCsv = () =>
    downloadCsv(
      `eightblock-articles-${rangeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
      rows.map((a) => ({
        title: a.title,
        url: siteHref(`/articles/${a.slug}`),
        author: a.authorName,
        published: a.publishedAt.slice(0, 10),
        views: a.views,
        readers: a.visitors,
        avg_read_seconds: Math.round(a.avgDuration),
        avg_scroll_percent: Math.round(a.avgScroll),
        claps: a.claps,
        replies: a.comments,
        saves: a.bookmarks,
      }))
    );

  const header = (
    key: SortKey,
    label: string,
    hint?: string,
    align: 'left' | 'right' = 'right'
  ) => (
    <th
      key={key}
      scope="col"
      className={cn('px-3 py-2.5 font-normal', align === 'right' ? 'text-right' : 'text-left')}
    >
      <button
        type="button"
        onClick={() => toggle(key)}
        title={hint}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground',
          sort.key === key && 'text-foreground'
        )}
      >
        {label}
        {sort.key === key &&
          (sort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <Panel marks={false}>
      <PanelBar>
        <span>Article performance</span>
        <span className="normal-case tracking-normal text-muted-foreground">
          {rows.length} published
        </span>
      </PanelBar>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-brand-blue">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or author"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="btn-pill-outline h-9 px-3 text-xs"
          disabled={rows.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border text-[11px] text-muted-foreground">
            <tr>
              {header('title', 'Article', undefined, 'left')}
              {COLUMNS.map((c) => header(c.key, c.label, c.hint))}
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                <td className="max-w-[360px] px-3 py-3">
                  <a
                    href={siteHref(`/articles/${a.slug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-1 font-medium text-foreground hover:underline"
                  >
                    {a.title}
                  </a>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {a.authorName ?? 'Unknown'} ·{' '}
                    {new Date(a.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </td>
                <Num value={formatNumber(a.views)} strong />
                <Num value={formatNumber(a.visitors)} />
                <Num value={a.avgDuration ? formatDuration(a.avgDuration) : '–'} />
                <Num value={a.avgScroll ? `${Math.round(a.avgScroll)}%` : '–'} />
                <Num value={formatNumber(a.claps)} />
                <Num value={formatNumber(a.comments)} />
                <Num value={formatNumber(a.bookmarks)} />
                <Num value={a.visitors ? formatNumber(engagement(a)) : '–'} />
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {query ? 'No article matches that search.' : 'No published articles yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 15 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full border-t border-border px-4 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAll ? 'Show top 15' : `Show all ${rows.length} articles`}
        </button>
      )}
    </Panel>
  );
}

function Num({ value, strong }: { value: string; strong?: boolean }) {
  return (
    <td
      className={cn(
        'px-3 py-3 text-right font-mono text-[13px] tabular-nums',
        strong ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {value}
    </td>
  );
}
