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
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center">
      <h1 className="max-w-2xl select-none text-5xl font-bold leading-tight tracking-tight text-[#080808] sm:text-6xl">
        Open Knowledge for the Cardano Community
      </h1>
      <p className="max-w-xl select-none text-base text-gray-600">
        A collaborative platform for the Cardano community, focusing on open-source culture,
        education, and community collaboration. All content is community-driven and open for
        contribution.
      </p>
      <div className="mt-2 flex flex-col justify-center gap-4 sm:flex-row">
        <Button
          onClick={onScrollToArticles}
          className="bg-[#080808] px-8 py-6 text-base hover:bg-[#080808]/90"
        >
          Read Articles
        </Button>
        <Button
          variant="outline"
          asChild
          className="border-[#080808] px-8 py-6 text-base text-[#080808] hover:bg-gray-50"
        >
          <Link href="https://github.com/Eightblockchain/eightblock" target="_blank">
            Contribute on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
