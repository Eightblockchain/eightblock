'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

/** The article editor brings its own chrome. */
function isStudioRoute(pathname: string) {
  return pathname === '/articles/new' || /^\/articles\/[^/]+\/edit$/.test(pathname);
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isStudioRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
