'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onScrollToArticles?: () => void;
}

export function Hero({ onScrollToArticles }: HeroProps) {
  const pathname = usePathname();

  // Only show hero on home page
  if (pathname !== '/') {
    return null;
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:gap-8 px-4 sm:px-6 py-16 sm:py-20 lg:py-24 text-center">
      <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-50 text-primary font-semibold text-[10px] sm:text-xs uppercase tracking-wider rounded-[2px] border border-primary-200">
        Cardano Community Platform
      </div>
      <h1 className="max-w-3xl select-none text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-foreground px-2">
        Open Knowledge for the <span className="text-primary">Cardano Community</span>
      </h1>
      <p className="max-w-2xl select-none text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed px-4">
        A collaborative platform for the Cardano community, focusing on open-source culture,
        education, and community collaboration. All content is community-driven and open for
        contribution.
      </p>
      <div className="mt-2 sm:mt-4 flex justify-center px-4 sm:px-0">
        <Button
          onClick={onScrollToArticles}
          size="lg"
          className="w-full sm:w-auto px-6 sm:px-8 shadow-lg hover:shadow-xl"
        >
          Read Articles
        </Button>
      </div>
    </section>
  );
}
