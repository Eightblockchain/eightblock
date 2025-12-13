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
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-24 text-center">
      <div className="inline-block px-4 py-2 bg-primary-50 text-primary font-semibold text-xs uppercase tracking-wider rounded-[2px] border border-primary-200">
        Cardano Community Platform
      </div>
      <h1 className="max-w-3xl select-none text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
        Open Knowledge for the <span className="text-primary">Cardano Community</span>
      </h1>
      <p className="max-w-2xl select-none text-lg text-muted-foreground leading-relaxed">
        A collaborative platform for the Cardano community, focusing on open-source culture,
        education, and community collaboration. All content is community-driven and open for
        contribution.
      </p>
      <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row">
        <Button onClick={onScrollToArticles} size="lg" className="px-8 shadow-lg hover:shadow-xl">
          Read Articles
        </Button>
        <Button variant="outline" asChild size="lg" className="px-8">
          <Link href="https://github.com/Eightblockchain/eightblock" target="_blank">
            Contribute on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
