import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. Built by the Cardano community.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href={siteConfig.links.github} className="hover:text-primary" target="_blank">
            GitHub
          </Link>
          <Link href={siteConfig.links.twitter} className="hover:text-primary" target="_blank">
            Twitter
          </Link>
        </div>
      </div>
    </footer>
  );
}
