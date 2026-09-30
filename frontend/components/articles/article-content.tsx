'use client';

import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px]">
      <div
        className="h-full bg-brand-blue transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(content ?? ''), [content]);

  return (
    <>
      <ReadingProgress />
      <article className="container-read py-12 sm:py-16">
        <div
          className="
            prose max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-4
            prose-h2:text-[1.65rem] prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            [&_p]:text-[17px] [&_p]:leading-[1.8] [&_p]:my-5
            prose-a:font-medium prose-a:text-link
            prose-strong:font-semibold
            prose-code:rounded-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-mono prose-code:font-normal
            prose-code:before:content-[''] prose-code:after:content-['']
            prose-pre:p-5 prose-pre:my-8 prose-pre:text-[13.5px]
            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
            prose-blockquote:border-l-2 prose-blockquote:pl-5 prose-blockquote:font-normal prose-blockquote:not-italic
            prose-img:my-10
            prose-hr:my-12
            prose-li:my-1.5
          "
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </>
  );
}
