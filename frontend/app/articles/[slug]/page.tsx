'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { PageViewTracker } from '@/lib/view-tracking';
import { useWallet } from '@/lib/wallet-context';
import { useToast } from '@/hooks/use-toast';
import { ArticleHeader } from '@/components/articles/article-header';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleEngagement } from '@/components/articles/article-engagement';
import { ArticleAuthor } from '@/components/articles/article-author';
import { CommentsSection } from '@/components/articles/comments-section';
import {
  ArticleHeaderSkeleton,
  ArticleContentSkeleton,
  ArticleEngagementSkeleton,
  ArticleAuthorSkeleton,
  CommentsSectionSkeleton,
} from '@/components/articles/article-skeleton';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';

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
  featuredImage?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  uniqueViews: number;
  author: {
    id: string;
    walletAddress: string;
    name: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    likes: number;
    comments: number;
  };
}

async function fetchArticle(slug: string): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${slug}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Article not found');
    throw new Error('Failed to fetch article');
  }
  return response.json();
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  const router = useRouter();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast?.() || { toast: () => {} };
  const viewTrackerRef = useRef<PageViewTracker | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
  }, [address]);

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

  const isPublished = article?.status === 'PUBLISHED';
  const isOwner = article?.author.id === userId;

  // Article interactions hook
  const {
    userLiked,
    bookmarked,
    comments,
    totalComments,
    hasMoreComments,
    isFetchingMoreComments,
    likeMutation,
    commentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    handleLike,
    handleBookmark,
    handleShare,
    loadMoreComments,
  } = useArticleInteractions({
    articleId: article?.id || '',
    userId,
    articleSlug: slug,
    isPublished,
  });

  // View tracking
  useEffect(() => {
    if (article?.id && isPublished && !viewTrackerRef.current) {
      viewTrackerRef.current = new PageViewTracker(article.id);
    }

    return () => {
      if (viewTrackerRef.current) {
        viewTrackerRef.current.track();
        viewTrackerRef.current = null;
      }
    };
  }, [article?.id, isPublished]);

  // Publish article handler
  const handlePublish = async () => {
    if (!article || !isOwner) return;

    try {
      const response = await fetch(`${API_URL}/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });

      if (response.ok) {
        toast.toast?.({ title: 'Success', description: 'Article published!' });
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
      }
    } catch (error) {
      toast.toast?.({
        title: 'Error',
        description: 'Failed to publish article',
        variant: 'destructive',
      });
    }
  };

  // Handle error state - only if query is enabled and actually failed
  if (slug && (isError || (!isLoading && !article))) {
    notFound();
  }

  // Handle draft access control - only if article is loaded
  if (article && article.status === 'DRAFT' && !isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Draft Article</h1>
          <p className="text-gray-600 mb-6">
            This article is currently in draft mode and can only be viewed by its author.
          </p>
          <Link href="/">
            <Button>Browse Published Articles</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate derived data only if article is available
  const readingTime = article ? Math.ceil(article.content.split(' ').length / 200) : 0;
  const likesCount = article
    ? (article._count?.likes || 0) +
      (userLiked && !likeMutation.isPending ? 0 : likeMutation.isPending && !userLiked ? 1 : 0)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header - Show skeleton while loading */}
      {!article || isLoading ? (
        <ArticleHeaderSkeleton />
      ) : (
        <ArticleHeader
          article={article}
          readingTime={readingTime}
          isOwner={isOwner}
          onBack={() => router.back()}
          onEdit={() => router.push(`/articles/${article.slug}/edit`)}
          onPublish={handlePublish}
        />
      )}

      {/* Article Content - Show skeleton while loading */}
      {!article || isLoading ? (
        <ArticleContentSkeleton />
      ) : (
        <ArticleContent content={article.content} />
      )}

      {/* Engagement and Comments - Only for published articles */}
      {isPublished && (
        <>
          {/* Article Engagement - Show skeleton while loading */}
          {!article || isLoading ? (
            <ArticleEngagementSkeleton />
          ) : (
            <ArticleEngagement
              likesCount={likesCount}
              commentsCount={totalComments}
              userLiked={userLiked}
              bookmarked={bookmarked}
              isLiking={likeMutation.isPending}
              onLike={handleLike}
              onComment={() => {
                const commentsSection = document.getElementById('comments');
                commentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              onShare={() => handleShare(article.title, article.description)}
              onBookmark={handleBookmark}
            />
          )}

          {/* Article Author - Show skeleton while loading */}
          {!article || isLoading ? (
            <ArticleAuthorSkeleton />
          ) : (
            <ArticleAuthor author={article.author} />
          )}

          {/* Comments Section - Show skeleton while loading */}
          {!article || isLoading ? (
            <CommentsSectionSkeleton />
          ) : (
            <CommentsSection
              comments={comments}
              totalComments={totalComments}
              hasMoreComments={hasMoreComments ?? false}
              isLoadingMoreComments={isFetchingMoreComments}
              isAuthenticated={!!address}
              currentUserId={userId}
              isPostingComment={commentMutation.isPending}
              isUpdatingComment={updateCommentMutation.isPending}
              isDeletingComment={deleteCommentMutation.isPending}
              onPostComment={(content) => commentMutation.mutate(content)}
              onUpdateComment={(commentId, content) =>
                updateCommentMutation.mutate({ commentId, content })
              }
              onDeleteComment={(commentId) => deleteCommentMutation.mutate(commentId)}
              onLoadMoreComments={loadMoreComments}
            />
          )}
        </>
      )}

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
