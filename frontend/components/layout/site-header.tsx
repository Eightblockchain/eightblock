'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const SearchComponent = dynamic(() => import('../search/Search'), {
  ssr: false,
  loading: () => <div className="w-5 h-5" />,
});
const LoginBtn = dynamic(() => import('../profile/LoginBtn'), {
  ssr: false,
  loading: () => <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />,
});

const navLinks = [
  { href: '/',             label: 'Home',         scrollId: null },
  { href: '/#articles',    label: 'Articles',     scrollId: 'articles' },
  { href: '/midnight',     label: 'Midnight',     scrollId: null, icon: Shield },
  { href: '/contributors', label: 'Contributors', scrollId: null },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/#articles') return false; // scroll target, never "active"
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNavClick = useCallback(
    (e: React.MouseEvent, scrollId: string | null, href: string) => {
      if (!scrollId) return;
      e.preventDefault();
      const el = document.getElementById(scrollId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Not on homepage — navigate there first, then scroll after load
        router.push('/');
        // The home page will render the section; a direct hash link handles the scroll
        window.location.href = '/#' + scrollId;
      }
    },
    [router]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY >= 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = () => setMobileMenuOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, []);

  return (
    <>
      <header
        className={`z-50 transition-all duration-300 ${
          isScrolled
            ? 'fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(88,177,225,0.12)]'
            : 'relative bg-transparent border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="Eightblock" width={160} height={40} priority className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, scrollId, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, scrollId ?? null, href)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  label === 'Midnight'
                    ? 'text-accent hover:bg-accent/10'
                    : isActive(href)
                    ? 'text-foreground bg-muted/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: search + theme + login */}
          <div className="hidden md:flex items-center gap-1">
            <SearchComponent />
            <ThemeToggle />
            <LoginBtn />
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1">
            <SearchComponent />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" aria-label="Open menu">
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background border-l border-border p-0">
                <SheetHeader className="border-b border-border px-6 py-4">
                  <SheetTitle className="text-left text-foreground">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <nav className="flex-1 px-4 py-6 space-y-1">
                    {navLinks.map(({ href, label, scrollId, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={(e) => { handleNavClick(e, scrollId ?? null, href); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          label === 'Midnight'
                            ? 'text-accent bg-accent/5 hover:bg-accent/10'
                            : isActive(href)
                            ? 'text-foreground bg-muted/60'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : <span className="w-4 h-4 flex-shrink-0" />}
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <div className="border-t border-border px-6 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    <LoginBtn />
                    <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Eightblock</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      {isScrolled && <div className="h-16" />}
    </>
  );
}
