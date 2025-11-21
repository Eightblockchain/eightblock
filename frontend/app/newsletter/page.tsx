import type { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter-signup';

export const metadata: Metadata = {
  title: 'Newsletter',
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm uppercase tracking-wide text-primary/70">Monthly dispatch</p>
        <h1 className="text-4xl font-bold">Community Newsletter</h1>
        <p className="mt-3 text-muted-foreground">
          We round up the latest Cardano governance proposals, Intersect working group wins, and
          guides for builders. Zero spam, always actionable.
        </p>
      </div>
      <NewsletterSignup />
    </div>
  );
}
