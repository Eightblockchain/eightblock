'use client';

import { useState } from 'react';
import { ArticleArchive, usePublishedTotal } from '@/components/articles/article-archive';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { formatBlockHeight } from '@/lib/chain';

export function WritingView({ tag, tagName }: { tag: string | null; tagName: string | null }) {
  const [matching, setMatching] = useState<number | null>(null);
  const { data: chainHeight } = usePublishedTotal();

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page flex flex-col gap-8 py-14 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{tagName ? `Topic · ${tagName}` : 'Archive'}</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              {tagName ? `Every ${tagName} block.` : 'Every block, in order.'}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {tagName
                ? `All articles about ${tagName}, newest first.`
                : 'Essays, tutorials and notes on web3, smart contracts and decentralized systems, newest first.'}
            </p>
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
        numbered
        onTotal={setMatching}
      />
    </>
  );
}
