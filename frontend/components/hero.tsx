import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center">
      {/* Cardano Logo */}
      <div className="absolute right-8 top-8 h-24 w-24 opacity-20">
        <svg viewBox="0 0 375 346" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="187.5" cy="173" r="4" fill="#080808" />
          <circle cx="187.5" cy="20" r="4" fill="#080808" />
          <circle cx="187.5" cy="326" r="4" fill="#080808" />
          <circle cx="50" cy="97" r="4" fill="#080808" />
          <circle cx="325" cy="97" r="4" fill="#080808" />
          <circle cx="50" cy="249" r="4" fill="#080808" />
          <circle cx="325" cy="249" r="4" fill="#080808" />
          <circle cx="110" cy="50" r="4" fill="#080808" />
          <circle cx="265" cy="50" r="4" fill="#080808" />
          <circle cx="110" cy="296" r="4" fill="#080808" />
          <circle cx="265" cy="296" r="4" fill="#080808" />
        </svg>
      </div>

      <h1 className="max-w-2xl select-none text-5xl font-bold leading-tight tracking-tight text-[#080808] sm:text-6xl">
        Open Knowledge for the Cardano Developer Community
      </h1>
      <p className="max-w-xl select-none text-base text-gray-600">
        A technical blog for Cardano developers, focusing on open-source culture and developer
        collaboration. All content is community-driven and open for contribution.
      </p>
      <div className="mt-2 flex flex-col justify-center gap-4 sm:flex-row">
        <Button asChild className="bg-[#080808] px-8 py-6 text-base hover:bg-[#080808]/90">
          <Link href="/articles">Read Articles</Link>
        </Button>
        <Button
          variant="outline"
          asChild
          className="border-[#080808] px-8 py-6 text-base text-[#080808] hover:bg-gray-50"
        >
          <Link href="https://github.com/Mechack08/eightblock" target="_blank">
            Contribute on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
