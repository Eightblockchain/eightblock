'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Hero } from '../hero';

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition >= 24);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`bg-white/95 backdrop-blur-md border-b border-gray-200 pt-6 transition-all duration-300 z-50 ${
          isSticky ? 'fixed top-0 left-0 right-0 pt-0 shadow-sm' : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-primary hover:opacity-80 transition-opacity"
          >
            <Image src="/logo.svg" alt="eightblock logo" width={150} height={40} priority />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <SearchComponent />
            <LoginBtn />
          </nav>
        </div>
      </header>

      {/* Spacer to prevent content jump when header becomes fixed */}
      {isSticky && <div className="h-[72px]" />}
    </>
  );
}
