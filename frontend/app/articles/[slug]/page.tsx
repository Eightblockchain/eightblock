import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allPosts } from 'contentlayer/generated';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleMeta } from '@/components/articles/article-meta';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} | eightblock`,
    description: post.description,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <span className="text-sm uppercase tracking-wide text-primary">{post.category}</span>
      <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="text-lg text-muted-foreground">{post.description}</p>
      <ArticleMeta post={post} />
      <ArticleContent code={post.body.code} />
    </article>
  );
}
