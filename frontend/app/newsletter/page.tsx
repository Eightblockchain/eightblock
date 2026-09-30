import type { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { siteConfig } from '@/lib/site-config';
import { ogImagePath, pageMetadata } from '@/lib/page-metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Newsletter',
  description: siteConfig.newsletter.description,
  path: '/newsletter',
  image: ogImagePath({
    title: siteConfig.newsletter.title,
    description: siteConfig.newsletter.description,
    eyebrow: 'Newsletter',
  }),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function getSubscriberCount(): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_URL}/subscriptions/stats`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

const promises = [
  {
    title: 'Only our own essays',
    body: 'Sent when a big one ships, or rounded up once a week. Never other people’s links, never filler.',
  },
  {
    title: 'No price talk',
    body: 'Technology, tooling and ideas. Never token calls or financial advice.',
  },
  {
    title: 'Leave anytime',
    body: 'Every email carries a one-click unsubscribe link. No questions asked.',
  },
];

export default async function NewsletterPage() {
  const subscriberCount = await getSubscriberCount();

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow>Newsletter</Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl">
              Follow the chain from your inbox.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {siteConfig.newsletter.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <NewsletterSignup subscriberCount={subscriberCount} />

        <div className="mt-10 grid border-l border-t border-border sm:grid-cols-3">
          {promises.map((item, i) => (
            <div key={item.title} className="border-b border-r border-border p-6">
              <span className="font-mono text-[11px] text-brand-blue">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-6 font-display text-lg font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
