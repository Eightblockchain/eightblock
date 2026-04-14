import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin, Shield } from 'lucide-react';

const footerLinks = {
  platform: [
    { href: '/',             label: 'Home' },
    { href: '/#articles',    label: 'Articles' },
    { href: '/midnight',     label: 'Midnight Hub' },
    { href: '/bookmarks',    label: 'Bookmarks' },
  ],
  community: [
    { href: '/contributors', label: 'Contributors' },
    { href: '/github',       label: 'GitHub Repository' },
    { href: '/privacy',      label: 'Privacy Policy' },
    { href: '/terms',        label: 'Terms of Service' },
  ],
};

const socialLinks = [
  {
    href: 'https://github.com/Eightblockchain/eightblock',
    icon: Github,
    label: 'GitHub',
  },
  {
    href: 'https://x.com/Eightblock66103',
    icon: Twitter,
    label: 'Twitter / X',
  },
  {
    href: 'https://www.linkedin.com/company/eightblock/',
    icon: Linkedin,
    label: 'LinkedIn',
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="Eightblock" width={140} height={36} className="h-8 w-auto opacity-90" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Privacy-first blockchain education. Your hub for Midnight Network,
              Zero-Knowledge proofs, and Web3 development.
            </p>
            <div className="flex gap-2 pt-1">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors ${
                      label === 'Midnight Hub'
                        ? 'text-primary hover:text-primary/80 flex items-center gap-1.5'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label === 'Midnight Hub' && <Shield className="h-3 w-3" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community</h4>
            <ul className="space-y-2.5">
              {footerLinks.community.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}{' '}
            <span className="text-foreground font-medium">Eightblock</span>
            {' · '}Open source under{' '}
            <a
              href="https://github.com/Eightblockchain/eightblock/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              MPL-2.0
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ by the <span className="text-accent">Cardano community</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
