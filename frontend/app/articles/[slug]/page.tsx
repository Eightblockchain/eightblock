'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  status: string;
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    walletAddress: string;
    name: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

async function fetchArticle(slug: string): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${slug}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Article not found');
    throw new Error('Failed to fetch article');
  }
  return response.json();
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [slug, setSlug] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    Promise.resolve(params).then((p) => setSlug(p.slug));
  }, [params]);

  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug),
    enabled: !!slug,
    retry: false,
  });

  if (!slug || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    notFound();
  }

  const readingTime = Math.ceil(article.content.split(' ').length / 200);
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{article.category}</Badge>
              {article.featured && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600">{article.description}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{article.author.name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.publishedAt}>{publishedDate}</time>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <Badge key={t.tag.id} variant="outline">
                    {t.tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-strong:font-semibold prose-strong:text-gray-900 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal">
          {article.content.split('\\n\\n').map((paragraph, index) => {
            // Simple paragraph rendering with preserved line breaks
            const lines = paragraph.split('\\n').filter(Boolean);
            if (lines.length === 0) return null;

            return (
              <div key={index} className="mb-6">
                {lines.map((line, lineIndex) => (
                  <p key={lineIndex} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </article>

      {/* Footer CTA */}
      <div className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Ready to explore more articles?</h2>
          <Link href="/">
            <Button size="lg">Browse All Articles</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
