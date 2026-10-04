'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatBlockDate, formatCount } from '@/lib/chain';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { TopicChip } from '@eightblock/ui/components/topic-chip';
import { topicSlug } from '@/lib/topics';
import {
  articleCategories,
  categoryHref,
  primaryLabel,
  type ArticleCategoryLink,
} from '@/lib/categories';
import {
  ARTICLE_VIEW_COUNT,
  type ArticleViewCountDetail,
} from '@/components/analytics/page-tracker';

interface ArticleHeaderProps {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string;
    content?: string;
    categories?: ArticleCategoryLink[];
    status: string;
    featured: boolean;
    featuredImage?: string;
    publishedAt: string;
    viewCount: number;
    author?: { name: string | null; username?: string | null } | null;
    tags: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
  readingTime: number;
  viewCountOverride?: number;
  likesCount?: number;
  commentsCount?: number;
}

export function ArticleHeader({
  article,
  readingTime,
  viewCountOverride,
  likesCount = 0,
  commentsCount = 0,
}: ArticleHeaderProps) {
  const [liveViewCount, setLiveViewCount] = useState(viewCountOverride ?? article.viewCount);

  useEffect(() => {
    const onCount = (event: Event) => {
      const { path, viewCount } = (event as CustomEvent<ArticleViewCountDetail>).detail;
      if (path === `/articles/${article.slug}`) setLiveViewCount(viewCount);
    };
    window.addEventListener(ARTICLE_VIEW_COUNT, onCount);
    return () => window.removeEventListener(ARTICLE_VIEW_COUNT, onCount);
  }, [article.slug]);

  const crumb = primaryLabel(article);
  const categories = articleCategories(article);

  const author = article.author;
  const details: { label: string; value: React.ReactNode }[] = [
    ...(author?.username
      ? [
          {
            label: 'Author',
            value: (
              <Link
                href={`/authors/${author.username}`}
                className="font-sans text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {author.name || author.username}
              </Link>
            ),
          },
        ]
      : []),
    { label: 'Published', value: formatBlockDate(article.publishedAt) },
    { label: 'Read time', value: `${readingTime} min` },
    { label: 'Views', value: formatCount(liveViewCount) },
    { label: 'Claps', value: formatCount(likesCount) },
    { label: 'Replies', value: formatCount(commentsCount) },
  ];

  return (
    <header className="border-b border-border">
      <div className="container-page pb-12 pt-10 sm:pt-12">
        <nav aria-label="Breadcrumb" className="ledger-label flex flex-wrap items-center gap-2">
          <Link href="/writing" className="transition-colors hover:text-brand-blue">
            Articles
          </Link>
          {crumb && (
            <>
              <span className="text-muted-foreground">/</span>
              <Link
                href={crumb.href}
                className="text-foreground transition-colors hover:text-brand-blue"
              >
                {crumb.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={categoryHref(category.slug)}
                  className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                >
                  <TopicChip
                    category={category.name}
                    className="transition-colors group-hover:border-brand-blue/50 group-hover:text-brand-blue"
                  />
                </Link>
              ))}
              {article.status === 'DRAFT' && <span className="ledger-label ml-1">Draft</span>}
            </div>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.25rem]">
              {article.title}
            </h1>

            {article.description && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {article.description}
              </p>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <Link
                    key={t.tag.id}
                    href={`/writing?tag=${topicSlug(t.tag.name)}`}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-blue/50 hover:text-brand-blue"
                  >
                    #{t.tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 lg:self-end">
            <Panel>
              <PanelBar>
                <span>Details</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={
                      article.status === 'PUBLISHED'
                        ? 'h-1.5 w-1.5 rounded-full bg-brand-blue'
                        : 'h-1.5 w-1.5 rounded-full bg-brand-gold'
                    }
                    aria-hidden="true"
                  />
                  {article.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
              </PanelBar>
              <dl>
                {details.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <dt className="ledger-label">{row.label}</dt>
                    <dd className="font-mono text-[13px] tabular-nums text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </aside>
        </div>
      </div>

      {article.featuredImage && (
        <div className="container-page pb-12">
          <div className="relative aspect-[2/1] overflow-hidden border border-border bg-card">
            <Image
              src={article.featuredImage}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1216px) 1152px, 100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </header>
  );
}
