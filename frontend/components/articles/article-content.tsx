'use client';

import { useMDXComponent } from 'next-contentlayer/hooks';
import { mdxComponents } from '@/lib/mdx';
import '@/styles/mdx.css';

export function ArticleContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return (
    <article className="mdx-content">
      <Component components={mdxComponents} />
    </article>
  );
}
