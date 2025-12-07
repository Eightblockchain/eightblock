'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
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
  return (
    <header className="bg-white/80 backdrop-blur pt-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-primary">
          <Image src="/logo.svg" alt="eightblock logo" width={150} height={40} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <SearchComponent />
          <LoginBtn />
        </nav>
      </div>

      <Hero />
    </header>
  );
}
