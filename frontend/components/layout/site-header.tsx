'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@eightblock/ui/components/sheet';
import { Avatar } from '@eightblock/ui/components/avatar';
import { ThemeToggle } from '@eightblock/ui/components/theme-toggle';
import { BrandHomeLink, BrandMark } from '@eightblock/ui/components/brand-mark';
import { UserMenu, useSignOut } from '@/components/layout/user-menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSignInDialog } from '@/components/auth/sign-in-dialog';
import { canWrite, isAdmin } from '@/lib/auth';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@eightblock/ui/utils';

const SearchComponent = dynamic(() => import('../search/Search'), {
  ssr: false,
  loading: () => <div className="h-9 w-9" />,
});

const navLinks = [
  { href: '/writing', label: 'Articles' },
  { href: '/about', label: 'About' },
];

function MobileAccount({ onNavigate }: { onNavigate: () => void }) {
  const { data: user, isLoading } = useCurrentUser();
  const handleSignOut = useSignOut();
  const openSignIn = useSignInDialog();

  if (isLoading) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate();
          openSignIn();
        }}
        className="btn-pill-outline mt-6 w-full"
      >
        Sign in
      </button>
    );
  }

  const links = [
    { href: '/settings', label: 'Profile settings', show: true },
    { href: '/bookmarks', label: 'Saved articles', show: true },
    { href: '/articles/new', label: 'Write an article', show: canWrite(user.role) },
    { href: '/my-articles', label: 'My articles', show: canWrite(user.role) },
    { href: siteConfig.adminUrl, label: 'Admin', show: isAdmin(user.role), external: true },
  ].filter((link) => link.show);

  return (
    <div className="mt-8 border-t border-border pt-4">
      <div className="flex items-center gap-3">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name || 'Reader'}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
            className="py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            onNavigate();
            void handleSignOut();
          }}
          className="py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <BrandHomeLink />
          <nav className="hidden h-16 items-stretch gap-7 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  '-mb-px flex items-center border-b-2 text-sm transition-colors',
                  isActive(href)
                    ? 'border-brand-blue font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <SearchComponent />
          <ThemeToggle />
          <UserMenu />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <SearchComponent />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
                <SheetTitle className="text-left">
                  <BrandMark className="h-8" title={siteConfig.name} />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col border-t border-border">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'border-b border-border py-4 text-sm transition-colors',
                      isActive(href) ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <MobileAccount onNavigate={() => setMobileMenuOpen(false)} />
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                <span className="ledger-label">Theme</span>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
