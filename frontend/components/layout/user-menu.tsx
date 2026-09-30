'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark, FileText, LayoutDashboard, LogOut, PenLine, UserRound } from 'lucide-react';
import { Avatar } from '@eightblock/ui/components/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canWrite, isAdmin, loginHref, signOut } from '@/lib/auth';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@eightblock/ui/utils';

const itemClass =
  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await signOut();
    queryClient.setQueryData(['current-user'], null);
    await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    await queryClient.invalidateQueries({ queryKey: ['bookmark-ids'] });
  };
}

export function UserMenu() {
  const { data: user, isLoading } = useCurrentUser();
  const pathname = usePathname();
  const handleSignOut = useSignOut();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isLoading) return <div className="h-9 w-[76px]" />;

  if (!user) {
    return (
      <Link
        href={loginHref(pathname.startsWith('/auth') ? '/' : pathname)}
        className="btn-pill-outline"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-foreground/40',
          open && 'border-brand-blue'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-64 overflow-hidden border border-border bg-background"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Avatar src={user.avatarUrl} name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name || 'Reader'}
              </p>
              {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <div className="py-1">
            <Link href="/settings" role="menuitem" className={itemClass}>
              <UserRound className="h-4 w-4" />
              Profile settings
            </Link>
            <Link href="/bookmarks" role="menuitem" className={itemClass}>
              <Bookmark className="h-4 w-4" />
              Saved articles
            </Link>
            {canWrite(user.role) && (
              <>
                <Link href="/articles/new" role="menuitem" className={itemClass}>
                  <PenLine className="h-4 w-4" />
                  Write an article
                </Link>
                <Link href="/my-articles" role="menuitem" className={itemClass}>
                  <FileText className="h-4 w-4" />
                  My articles
                </Link>
              </>
            )}
            {isAdmin(user.role) && (
              <a href={siteConfig.adminUrl} role="menuitem" className={itemClass}>
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </a>
            )}
          </div>
          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void handleSignOut();
              }}
              className={itemClass}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
