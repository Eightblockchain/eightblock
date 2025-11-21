import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">Cardano Education</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Learn, build, and govern the Cardano ecosystem together.
      </h1>
      <p className="text-lg text-muted-foreground">
        eightblock is a community-driven publication for blockchain builders, Intersect members, and
        the broader web3 world. Read deep dives, ship tutorials, and collaborate on open knowledge.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/articles">Explore Articles</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/newsletter">Join Newsletter</Link>
        </Button>
      </div>
    </section>
  );
}
