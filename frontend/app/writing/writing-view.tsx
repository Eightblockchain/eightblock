'use client';

import { useState } from 'react';
import { ArticleArchive, usePublishedTotal } from '@/components/articles/article-archive';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { formatBlockHeight } from '@/lib/chain';
import type { PublishedCategory } from '@/lib/categories';

interface ActiveCategory {
  slug: string;
  name: string;
  description: string | null;
}

function heading(category: ActiveCategory | null, tagName: string | null) {
  if (category && tagName) {
    return {
      eyebrow: `${category.name} · ${tagName}`,
      title: `${tagName} on ${category.name}.`,
      intro: `All ${tagName} articles filed under ${category.name}, newest first.`,
    };
  }
  if (category) {
    return {
      eyebrow: `Blockchain · ${category.name}`,
      title: `Every ${category.name} block.`,
      intro: category.description || `All articles about ${category.name}, newest first.`,
    };
  }
  if (tagName) {
    return {
      eyebrow: `Topic · ${tagName}`,
      title: `Every ${tagName} block.`,
      intro: `All articles about ${tagName}, newest first.`,
    };
  }
  return {
    eyebrow: 'Archive',
    title: 'Every block, in order.',
    intro:
      'Essays, tutorials and notes on web3, smart contracts and decentralized systems, newest first.',
  };
}

export function WritingView({
  tag,
  tagName,
  category,
  categories,
}: {
  tag: string | null;
  tagName: string | null;
  category: ActiveCategory | null;
  categories: PublishedCategory[];
}) {
  const [matching, setMatching] = useState<number | null>(null);
  const { data: chainHeight } = usePublishedTotal();
  const { eyebrow, title, intro } = heading(category, tagName);

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page flex flex-col gap-8 py-14 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>
          </div>
          <dl className="flex gap-8">
            <div>
              <dt className="ledger-label">Chain height</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">
                {chainHeight === undefined ? '…' : formatBlockHeight(chainHeight)}
              </dd>
            </div>
            <div>
              <dt className="ledger-label">Showing</dt>
              <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">
                {matching ?? '…'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <ArticleArchive
        basePath="/writing"
        tag={tag}
        tagName={tagName}
        category={category?.slug ?? null}
        categoryName={category?.name ?? null}
        categories={categories}
        numbered
        onTotal={setMatching}
      />
    </>
  );
}
