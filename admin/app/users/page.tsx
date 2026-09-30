'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Users } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Avatar } from '@eightblock/ui/components/avatar';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { Input } from '@eightblock/ui/components/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@eightblock/ui/components/alert-dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { ROLES, type UserRole } from '@/lib/auth';
import { formatBlockDate, formatCount } from '@/lib/format';
import { fetchUsers, updateUserRole, type AdminUser } from '@/lib/services/user-service';
import { cn } from '@eightblock/ui/utils';

const PAGE_SIZE = 20;

type Filter = 'ALL' | UserRole;

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'READER', label: 'Readers' },
  { value: 'WRITER', label: 'Writers' },
  { value: 'EDITOR', label: 'Editors' },
  { value: 'ADMIN', label: 'Admins' },
];

const roleLabel = (role: UserRole) => ROLES.find((r) => r.value === role)?.label ?? role;

interface PendingChange {
  user: AdminUser;
  role: UserRole;
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function UsersAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const q = useDebounced(search.trim());

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-users', q, filter, page],
    queryFn: () =>
      fetchUsers({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        role: filter === 'ALL' ? undefined : filter,
      }),
    placeholderData: keepPreviousData,
  });

  const change = useMutation({
    mutationFn: ({ user, role }: PendingChange) => updateUserRole(user.id, role),
    onSuccess: async (updated, { user }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const name = user.name || user.email || 'This user';
      toast({
        title: `${name} is now ${updated.role === 'ADMIN' ? 'an' : 'a'} ${roleLabel(updated.role).toLowerCase()}`,
        description:
          updated.role === 'READER'
            ? 'They can no longer write or edit articles. Their existing articles stay online.'
            : 'The change applies right away. They may need to reload the page to see new options.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not change the role',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    },
    onSettled: () => setPending(null),
  });

  const requestChange = (user: AdminUser, role: UserRole) => {
    if (role === user.role) return;
    // Granting or removing admin is the only change that affects who controls the site, so confirm it.
    if (role === 'ADMIN' || user.role === 'ADMIN') setPending({ user, role });
    else change.mutate({ user, role });
  };

  const counts = data?.counts;

  return (
    <div className="container-page py-14">
      <Eyebrow>People</Eyebrow>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
        Users and roles
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Everyone who signs in starts as a reader. Make someone a writer and they can start drafting
        and publishing straight away.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <Panel key={role.value} marks={false} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">{role.label}</p>
              {counts && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCount(counts[role.value])}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {role.description}
            </p>
          </Panel>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter by role"
          className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border sm:border-0"
        >
          {filters.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm transition-colors',
                  active
                    ? 'border-brand-blue font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                {counts && (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatCount(counts[value])}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            aria-label="Search users by name or email"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4 border-t border-border">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Could not load users. Refresh the page to try again.
          </p>
        )}

        {data && data.users.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-4 font-medium">No users found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? 'Try another name or email.' : 'Nobody has this role yet.'}
            </p>
          </div>
        )}

        {data?.users.map((user) => {
          const isMe = user.id === me?.id;
          const locked = isMe || user.managedByConfig;
          const saving = change.isPending && change.variables?.user.id === user.id;
          return (
            <div
              key={user.id}
              className={cn(
                'grid gap-4 border-b border-border py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8',
                isFetching && !isLoading && 'opacity-70'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.name} size="md" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {user.name || 'Unnamed reader'}
                    {isMe && (
                      <span className="ledger-label rounded-full border border-brand-blue/40 bg-brand-blue/10 px-2 py-0.5 text-foreground">
                        You
                      </span>
                    )}
                  </p>
                  {user.email && (
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  )}
                  <p className="ledger-label mt-1 normal-case tracking-normal">
                    Joined {formatBlockDate(user.createdAt)} · {formatCount(user._count.articles)}{' '}
                    {user._count.articles === 1 ? 'article' : 'articles'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <select
                  value={user.role}
                  disabled={locked || saving}
                  onChange={(event) => requestChange(user, event.target.value as UserRole)}
                  aria-label={`Role of ${user.name || user.email}`}
                  title={
                    isMe
                      ? 'You cannot change your own role'
                      : user.managedByConfig
                        ? 'Set by ADMIN_EMAILS on the server'
                        : undefined
                  }
                  className="h-9 min-w-[8.5rem] cursor-pointer rounded-full border border-border bg-background px-3 text-sm text-foreground transition-colors [color-scheme:light] hover:border-foreground/40 focus-visible:border-brand-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:[color-scheme:dark]"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              {locked && (
                <p className="text-xs text-muted-foreground sm:col-span-2 sm:-mt-2 sm:text-right">
                  {isMe
                    ? 'Another admin has to change your role.'
                    : 'Admin through ADMIN_EMAILS on the server. Remove the email there to change it.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="btn-pill-outline disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="ledger-label">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn-pill-outline disabled:opacity-40"
            disabled={!data.pagination.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && !change.isPending && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.role === 'ADMIN' ? 'Make this user an admin?' : 'Remove admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.role === 'ADMIN'
                ? `${pending.user.name || pending.user.email} will get full control of the site, including the portfolio, newsletter and everyone's roles.`
                : `${pending?.user.name || pending?.user.email} will become ${pending ? roleLabel(pending.role).toLowerCase() : ''} and lose access to admin tools.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={change.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2"
              disabled={change.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pending) change.mutate(pending);
              }}
            >
              {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending?.role === 'ADMIN' ? 'Make admin' : 'Remove admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
