'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SignInDialogProvider } from '@/components/auth/sign-in-dialog';

/** The article editor brings its own chrome; the sign-in popup's last page needs none. */
function isBareRoute(pathname: string) {
  return (
    pathname === '/articles/new' ||
    /^\/articles\/[^/]+\/edit$/.test(pathname) ||
    pathname === '/auth/done'
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SignInDialogProvider>
      {isBareRoute(pathname) ? (
        children
      ) : (
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      )}
    </SignInDialogProvider>
  );
}
