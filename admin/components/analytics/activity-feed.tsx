'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Bookmark,
  FileText,
  Hand,
  Loader2,
  MailMinus,
  MailPlus,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { timeAgoShort } from '@/lib/analytics';
import {
  ACTIVITY_KINDS,
  fetchActivity,
  type ActivityItem,
  type ActivityKind,
} from '@/lib/services/analytics-service';
import { cn } from '@eightblock/ui/utils';
import { siteHref } from '@/lib/site-config';

const KIND_META: Record<ActivityKind, { label: string; icon: LucideIcon }> = {
  signup: { label: 'Sign-ups', icon: UserPlus },
  published: { label: 'Published', icon: FileText },
  comment: { label: 'Replies', icon: MessageSquare },
  clap: { label: 'Claps', icon: Hand },
  bookmark: { label: 'Saves', icon: Bookmark },
  subscribe: { label: 'Subscribed', icon: MailPlus },
  unsubscribe: { label: 'Unsubscribed', icon: MailMinus },
};

function Actor({ item, fallback }: { item: ActivityItem; fallback: string }) {
  const name = item.actor || fallback;
  if (item.username) {
    return (
      <a
        href={siteHref(`/authors/${item.username}`)}
        className="font-medium text-foreground hover:underline"
      >
        {name}
      </a>
    );
  }
  return <span className="font-medium text-foreground">{name}</span>;
}

function Target({ item }: { item: ActivityItem }) {
  if (!item.slug) return null;
  return (
    <a
      href={siteHref(`/articles/${item.slug}`)}
      className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
    >
      {item.title}
    </a>
  );
}

function Sentence({ item }: { item: ActivityItem }) {
  switch (item.kind) {
    case 'signup':
      return (
        <>
          <Actor item={item} fallback="Someone" /> created an account
        </>
      );
    case 'published':
      return (
        <>
          <Actor item={item} fallback="A writer" /> published <Target item={item} />
        </>
      );
    case 'comment':
      return (
        <>
          <Actor item={item} fallback="A reader" /> replied to <Target item={item} />
        </>
      );
    case 'clap':
      return (
        <>
          <Actor item={item} fallback="A visitor" /> clapped for <Target item={item} />
        </>
      );
    case 'bookmark':
      return (
        <>
          <Actor item={item} fallback="A reader" /> saved <Target item={item} />
        </>
      );
    case 'subscribe':
      return (
        <>
          <Actor item={item} fallback="Someone" /> subscribed to the newsletter
        </>
      );
    case 'unsubscribe':
      return (
        <>
          <Actor item={item} fallback="Someone" /> unsubscribed from the newsletter
        </>
      );
  }
}

function dayHeading(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Every sign-up, article, reply, clap, save and subscription, newest first. */
export function ActivityFeed({
  from,
  to,
  compact = false,
}: {
  from?: string;
  to?: string;
  compact?: boolean;
}) {
  const [kinds, setKinds] = useState<ActivityKind[]>([...ACTIVITY_KINDS]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['analytics', 'activity', kinds.join(','), from ?? null, to ?? null, compact],
      queryFn: ({ pageParam }) =>
        fetchActivity({ kinds, before: pageParam ?? undefined, from, to, limit: compact ? 8 : 40 }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
      enabled: kinds.length > 0,
      refetchInterval: 60_000,
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const toggle = (kind: ActivityKind) =>
    setKinds((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));

  let lastDay = '';

  return (
    <Panel marks={false}>
      <PanelBar>
        <span>{compact ? 'Latest activity' : 'Activity log'}</span>
        <span className="normal-case tracking-normal text-muted-foreground">
          Updates every minute
        </span>
      </PanelBar>

      {!compact && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          {ACTIVITY_KINDS.map((kind) => {
            const { label, icon: Icon } = KIND_META[kind];
            const on = kinds.includes(kind);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggle(kind)}
                aria-pressed={on}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  on
                    ? 'border-brand-blue/40 bg-brand-blue/10 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {isError && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Could not load activity.
        </p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {kinds.length === 0
            ? 'Pick at least one type of activity.'
            : 'Nothing happened in this period.'}
        </p>
      )}

      <ol>
        {items.map((item) => {
          const { icon: Icon } = KIND_META[item.kind];
          const day = dayHeading(item.at);
          const showDay = !compact && day !== lastDay;
          lastDay = day;
          return (
            <li key={item.id}>
              {showDay && (
                <p className="ledger-label border-b border-border bg-muted/40 px-4 py-2">{day}</p>
              )}
              <div className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                    item.kind === 'unsubscribe'
                      ? 'border-border text-muted-foreground'
                      : 'border-brand-blue/40 bg-brand-blue/10 text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <Sentence item={item} />
                  </p>
                  {item.kind === 'comment' && item.detail && (
                    <p className="mt-1 line-clamp-2 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                </div>
                <time
                  dateTime={item.at}
                  title={new Date(item.at).toLocaleString()}
                  className="shrink-0 font-mono text-[11px] text-muted-foreground"
                >
                  {timeAgoShort(item.at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>

      {!compact && hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
          Load older activity
        </button>
      )}
    </Panel>
  );
}
