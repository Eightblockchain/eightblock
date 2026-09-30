import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Article } from '@/hooks/useInfiniteArticles';
import { siteConfig } from '@/lib/site-config';
import { readingTime, timeAgo } from '@/lib/chain';
import { buildTopics, topicSlug } from '@/lib/topics';
import { cn } from '@eightblock/ui/utils';
import { CornerMarks } from '@eightblock/ui/components/panel';
import { Eyebrow, SectionHeader } from '@eightblock/ui/components/section-header';
import { BlockCard } from '@/components/articles/block-card';
import { ChainPanel } from '@/components/home/chain-panel';

const pad = (n: number) => String(n).padStart(2, '0');

export function Hero({ latest, total }: { latest: Article[]; total: number }) {
  const { hero, networks } = siteConfig;

  return (
    <section className="border-b border-border">
      <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="flex flex-col justify-center lg:col-span-7">
          <Eyebrow className="animate-fade-up">{hero.eyebrow}</Eyebrow>

          <h1 className="mt-6 animate-fade-up font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[3.6rem] xl:text-[4.25rem]">
            <span className="block">{hero.titleLead}</span>
            <span className="block text-muted-foreground">{hero.titleTrail}</span>
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-muted-foreground">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/writing" className="btn-pill h-11 px-6">
              Start reading
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#newsletter" className="btn-pill-outline h-11 bg-background px-6">
              Get new posts by email
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 lg:self-center">
          <ChainPanel articles={latest.slice(0, 4)} total={total} />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-8">
          <span className="ledger-label shrink-0">Networks covered</span>
          <nav aria-label="Networks" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {networks.map((network) => (
              <Link
                key={network}
                href={`/writing?tag=${topicSlug(network)}`}
                className="text-sm font-medium text-foreground/75 transition-colors hover:text-brand-blue"
              >
                {network}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

export function StatsStrip({ articles, total }: { articles: Article[]; total: number }) {
  const topics = new Set(articles.map((a) => a.category).filter(Boolean)).size;
  const minutes = articles.reduce((sum, a) => sum + readingTime(a.content), 0);

  const stats = [
    { label: 'Blocks published', value: total.toLocaleString() },
    { label: 'Topics covered', value: String(topics) },
    { label: 'Minutes of reading', value: minutes.toLocaleString() },
    { label: 'Latest block', value: articles[0] ? timeAgo(articles[0].publishedAt) : 'None yet' },
  ];

  return (
    <section className="border-b border-border">
      <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              'border-border px-4 py-7 sm:px-6',
              i % 2 === 1 && 'border-l',
              i >= 2 && 'border-t lg:border-t-0',
              i === 2 && 'lg:border-l'
            )}
          >
            <dt className="ledger-label">{stat.label}</dt>
            <dd
              className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground"
              suppressHydrationWarning
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FeaturedBlocks({
  articles,
  heights,
  total,
}: {
  articles: Article[];
  heights: Map<string, number>;
  total: number;
}) {
  return (
    <section className="border-b border-border">
      <div className="container-page py-20">
        <SectionHeader
          index="01"
          label="Most read"
          title="What readers come back to."
          description="The posts that have helped the most readers so far. A good place to start if you are new here."
          action={
            <Link
              href="/writing"
              className="ledger-label inline-flex items-center gap-1.5 transition-colors hover:text-brand-blue"
            >
              All {total} blocks
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {articles.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-20 text-center">
            <p className="font-display text-lg font-medium">No blocks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">New writing will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <BlockCard
                key={article.id}
                article={article}
                height={heights.get(article.id)}
                priority={i < 3}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function TopicsGrid({ articles }: { articles: Article[] }) {
  const topics = buildTopics(articles, siteConfig.categories, 9);

  return (
    <section className="border-b border-border">
      <div className="container-page py-20">
        <SectionHeader
          index="02"
          label="Explore by topic"
          title="Start where you are."
          description="From setting up your first wallet to writing validators. Pick a network or a theme and follow along."
        />

        <div className="grid grid-cols-2 border-l border-t border-border md:grid-cols-3">
          {topics.map(({ label: category, slug, count }, i) => {
            return (
              <Link
                key={slug}
                href={`/writing?tag=${encodeURIComponent(slug)}`}
                className="group relative flex min-h-[8.5rem] flex-col justify-between border-b border-r border-border p-5 transition-colors hover:bg-card sm:p-6"
              >
                <CornerMarks className="text-brand-blue opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="flex items-center justify-between">
                  <span className="ledger-label">{pad(i + 1)}</span>
                  <ArrowUpRight className="h-4 w-4 text-brand-blue opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span>
                  <span className="block font-display text-lg font-medium text-foreground transition-colors group-hover:text-brand-blue sm:text-xl">
                    {category}
                  </span>
                  <span className="ledger-label mt-1 block">
                    {count > 0 ? `${count} ${count === 1 ? 'block' : 'blocks'}` : 'Coming soon'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Principles() {
  return (
    <section className="border-b border-border">
      <div className="container-page grid gap-10 py-20 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <SectionHeader index="03" label="Why read here" className="mb-6" />
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
            Written to be trusted.
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            A personal notebook from someone building in the space. Not a news feed, and not a
            marketing channel.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand-blue"
          >
            About the author
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid border-l border-t border-border sm:grid-cols-3 lg:col-span-8">
          {siteConfig.principles.map((principle, i) => (
            <div key={principle.title} className="border-b border-r border-border p-6">
              <span className="font-mono text-[11px] text-brand-blue">{pad(i + 1)}</span>
              <h3 className="mt-10 font-display text-lg font-semibold text-foreground">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
