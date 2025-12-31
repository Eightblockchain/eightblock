'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Dynamically import client components to reduce initial bundle
const SearchComponent = dynamic(() => import('../search/Search'), {
  ssr: false,
  loading: () => <div className="w-5 h-5" />,
});

const LoginBtn = dynamic(() => import('../profile/LoginBtn'), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />,
});

export function SiteHeader() {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition >= 24);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <>
      <header
        className={`bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300 z-50 ${
          isSticky ? 'fixed top-0 left-0 right-0 shadow-sm' : 'pt-6 border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold text-primary hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src="/logo.svg"
              alt="eightblock logo"
              width={200}
              height={60}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
            <SearchComponent />
            <LoginBtn />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="border-b border-gray-200 px-6 py-4">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  {/* Mobile Navigation Content */}
                  <nav className="flex-1 px-6 py-6 space-y-6">
                    {/* Search Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Search
                      </h3>
                      <div className="flex justify-start">
                        <SearchComponent />
                      </div>
                    </div>

                    {/* Account Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Account
                      </h3>
                      <div className="flex flex-col gap-2">
                        <LoginBtn />
                      </div>
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="border-t border-gray-200 px-6 py-4">
                    <p className="text-xs text-gray-500">
                      © {new Date().getFullYear()} EightBlock. All rights reserved.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content jump when header becomes fixed */}
      {isSticky && <div className="h-[72px]" />}
    </>
  );
}
