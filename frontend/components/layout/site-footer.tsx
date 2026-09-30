'use client';

import Link from 'next/link';
import { Github, Rss, Twitter } from 'lucide-react';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { siteConfig } from '@/lib/site-config';
import { BrandMark } from '@eightblock/ui/components/brand-mark';

const exploreLinks = [
  { href: '/writing', label: 'Articles' },
  { href: '/about', label: 'About' },
  { href: '/newsletter', label: 'Newsletter' },
];

const socialLinks = [
  { href: siteConfig.links.github, label: 'GitHub', icon: Github },
  { href: siteConfig.links.twitter, label: 'X / Twitter', icon: Twitter },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="container-page grid grid-cols-1 gap-12 py-14 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-5 lg:col-span-5">
          <Link href="/" className="inline-flex" aria-label={`${siteConfig.name} home`}>
            <BrandMark className="h-9" />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {siteConfig.tagline}
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
            <a
              href="/feed.xml"
              aria-label="RSS feed"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <Rss className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="ledger-label mb-4">Explore</p>
          <ul className="space-y-2.5">
            {exploreLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-brand-blue"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <p className="ledger-label mb-4">Newsletter</p>
          <NewsletterSignup variant="compact" />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="ledger-label normal-case tracking-normal">
            © {year} {siteConfig.name}
          </p>
          <nav aria-label="Legal" className="flex items-center gap-5">
            <Link href="/privacy" className="ledger-label transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="ledger-label transition-colors hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
