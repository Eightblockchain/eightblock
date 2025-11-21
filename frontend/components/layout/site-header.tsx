import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/admin', label: 'Admin' },
  { href: '/newsletter', label: 'Newsletter' },
];

export function SiteHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-primary">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={siteConfig.links.github}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          target="_blank"
        >
          Contribute
        </Link>
      </div>
    </header>
  );
}
