'use client';

import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

// ── Reading progress bar ──────────────────────────────────────────────────────
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-border/20 pointer-events-none">
      <div
        className="h-full bg-primary transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Article body ──────────────────────────────────────────────────────────────
interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(content ?? ''), [content]);

  return (
    <>
      <ReadingProgress />
      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        <div
          className="
            prose max-w-none
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
            prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-5
            prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-2
            [&_p]:text-[16.5px] [&_p]:leading-[1.9] [&_p]:my-5 [&_p]:text-foreground/85
            prose-a:text-accent prose-a:no-underline prose-a:border-b prose-a:border-accent/35
            hover:prose-a:border-accent hover:prose-a:brightness-110 prose-a:transition-all
            prose-strong:font-bold prose-strong:text-foreground
            [&_em]:text-foreground/70
            prose-code:rounded prose-code:bg-card prose-code:border prose-code:border-border/50
            prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
            prose-code:text-primary prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:bg-[hsl(0_0%_6%)] prose-pre:border prose-pre:border-border/40
            prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-8 prose-pre:overflow-x-auto
            [&_pre_code]:text-foreground [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
            prose-blockquote:border-l-[3px] prose-blockquote:border-primary
            prose-blockquote:pl-5 prose-blockquote:py-2 prose-blockquote:pr-5 prose-blockquote:my-8
            prose-blockquote:bg-card/30 prose-blockquote:rounded-r-xl
            [&_blockquote_p]:text-foreground/75 prose-blockquote:not-italic
            prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-6
            [&_li]:text-foreground/85 [&_li]:leading-[1.8] [&_li]:my-1.5
            prose-img:rounded-xl prose-img:my-8 prose-img:border prose-img:border-border/25
            prose-hr:border-border/20 prose-hr:my-10
            prose-table:border-collapse prose-thead:border-b prose-thead:border-border/40
            prose-th:text-foreground prose-th:font-bold prose-th:py-2 prose-th:px-4
            [&_td]:text-foreground/90 prose-td:py-2 prose-td:px-4
            prose-tr:border-b prose-tr:border-border/20
          "
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </>
  );
}

