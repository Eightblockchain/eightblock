'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, FileText, Loader2, LogOut, Menu, PenLine } from 'lucide-react';
import { Avatar } from '@eightblock/ui/components/avatar';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@eightblock/ui/components/sheet';
import { ThemeToggle } from '@eightblock/ui/components/theme-toggle';
import { cn } from '@eightblock/ui/utils';
import { AdminGate } from '@/components/auth/admin-gate';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isAdmin, signOut } from '@/lib/auth';
import { siteConfig, siteHref } from '@/lib/site-config';

const adminLinks = [
  { href: '/', label: 'Overview' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/support', label: 'Support' },
  { href: '/users', label: 'Users' },
];

const siteLinks = [
  { href: siteHref('/articles/new'), label: 'Write an article', icon: PenLine },
  { href: siteHref('/my-articles'), label: 'My articles', icon: FileText },
  { href: siteConfig.siteUrl, label: 'View site', icon: ArrowUpRight },
];

const itemClass =
  'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function useAdminSignOut() {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const leave = async () => {
    setLeaving(true);
    await signOut().catch(() => undefined);
    queryClient.setQueryData(['current-user'], null);
    setLeaving(false);
  };
  return { leaving, leave };
}

function AccountMenu() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const { leaving, leave } = useAdminSignOut();
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

  if (!user) return null;

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
              <p className="truncate text-sm font-medium text-foreground">{user.name || 'Admin'}</p>
              {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <div className="py-1">
            {siteLinks.map(({ href, label, icon: Icon }) => (
              <a key={label} href={href} role="menuitem" className={itemClass}>
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </div>
          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              disabled={leaving}
              onClick={() => void leave()}
              className={itemClass}
            >
              {leaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const { data: user } = useCurrentUser();
  const isActive = useIsActive();
  const { leaving, leave } = useAdminSignOut();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-left">
            <BrandMark className="h-8" title={`${siteConfig.name} admin`} />
            <span className="ledger-label border-l border-border pl-3">Admin</span>
          </SheetTitle>
        </SheetHeader>
        {signedIn && (
          <nav className="mt-8 flex flex-col border-t border-border">
            {adminLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-border py-4 text-sm transition-colors',
                  isActive(href) ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-8 border-t border-border pt-4">
          {signedIn && user && (
            <div className="mb-3 flex items-center gap-3">
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name || 'Admin'}</p>
                {user.email && (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col">
            {(signedIn ? siteLinks : siteLinks.slice(-1)).map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
            {signedIn && (
              <button
                type="button"
                disabled={leaving}
                onClick={() => void leave().then(() => setOpen(false))}
                className="py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <span className="ledger-label">Theme</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = useIsActive();
  const { data: user } = useCurrentUser();
  const isLogin = pathname.startsWith('/login');
  const signedIn = isAdmin(user?.role) && !isLogin;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8 lg:gap-10">
            <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Admin overview">
              <BrandMark className="h-8" title={`${siteConfig.name} admin`} />
              <span className="ledger-label border-l border-border pl-3">Admin</span>
            </Link>
            {signedIn && (
              <nav className="hidden h-16 items-stretch gap-6 md:flex lg:gap-7">
                {adminLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={cn(
                      '-mb-px flex items-center whitespace-nowrap border-b-2 text-sm transition-colors',
                      isActive(href)
                        ? 'border-brand-blue font-medium text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a href={siteConfig.siteUrl} className="btn-pill-outline mr-1 hidden lg:inline-flex">
              View site
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <ThemeToggle />
            {signedIn && <AccountMenu />}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <MobileMenu signedIn={signedIn} />
          </div>
        </div>
      </header>
      <main className="flex-1">{isLogin ? children : <AdminGate>{children}</AdminGate>}</main>
      <footer className="border-t border-border">
        <div className="container-page py-5">
          <p className="ledger-label">{siteConfig.name} admin</p>
        </div>
      </footer>
    </div>
  );
}
