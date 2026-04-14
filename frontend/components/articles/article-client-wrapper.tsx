'use client';

import { ArticleEngagement } from '@/components/articles/article-engagement';
import { CommentsSection } from '@/components/articles/comments-section';
import { useArticleTracking } from '@/hooks/useArticleTracking';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Edit2 } from 'lucide-react';

interface ArticleClientWrapperProps {
  articleId: string;
  articleSlug: string;
  authorId: string | null;
  initialLikesCount: number;
  initialCommentsCount: number;
  initialViewCount: number;
  isPublished: boolean;
}

export function ArticleClientWrapper({
  articleId,
  articleSlug,
  authorId,
  initialLikesCount,
  initialCommentsCount,
  initialViewCount,
  isPublished,
}: ArticleClientWrapperProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [viewCount, setViewCount] = useState(initialViewCount);

  // Get authenticated user using React Query
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const userId = currentUser?.id || null;
  const isOwner = !!userId && !!authorId && userId === authorId;

  // Track article view (automatic on mount) — increment local count and notify header
  useArticleTracking({
    articleId,
    enabled: isPublished,
    onTracked: () => {
      setViewCount((v) => v + 1);
      window.dispatchEvent(new CustomEvent('article-view-tracked'));
    },
  });

  // Get article interactions (likes, comments, bookmarks)
  const {
    userLiked,
    isUserLikedLoading,
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
    articleId,
    userId,
    articleSlug,
    isPublished,
  });

  // Once we know the user's like status, correct the count if the ISR-cached
  // initialLikesCount is stale (e.g. user liked the article after the last revalidation
  // so the server-rendered count is 0 even though userLiked = true).
  const countCorrectedRef = useRef(false);
  useEffect(() => {
    if (countCorrectedRef.current) return;
    // Wait until we know who the user is (currentUser query resolved)
    // and, if logged in, until the like-status query has also resolved.
    if (isCurrentUserLoading || (userId !== null && isUserLikedLoading)) return;
    countCorrectedRef.current = true;
    if (userLiked && likesCount === 0) {
      // The ISR page was cached before this user's like — bump to at least 1.
      setLikesCount(1);
    }
  }, [isCurrentUserLoading, isUserLikedLoading, userId, userLiked, likesCount]);

  // Update likes count optimistically when user likes/unlikes
  const handleLikeWithOptimisticUpdate = () => {
    // Floor at 0 to guard against stale initialLikesCount producing -1
    setLikesCount((prev) => (userLiked ? Math.max(0, prev - 1) : prev + 1));
    handleLike();
  };

  const handleComment = () => {
    const commentsSection = document.getElementById('comments');
    commentsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePostComment = async (content: string) => {
    if (!userId) {
      return;
    }
    await commentMutation.mutateAsync(content);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!userId) {
      return;
    }
    await updateCommentMutation.mutateAsync({ commentId, content });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      return;
    }
    await deleteCommentMutation.mutateAsync(commentId);
  };

  return (
    <>
      {isOwner && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 mb-4 flex justify-end">
          <Link
            href={`/articles/${articleSlug}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit article
          </Link>
        </div>
      )}
      <ArticleEngagement
        likesCount={likesCount}
        commentsCount={totalComments || initialCommentsCount}
        userLiked={userLiked}
        bookmarked={bookmarked}
        isLiking={likeMutation.isPending}
        onLike={handleLikeWithOptimisticUpdate}
        onComment={handleComment}
        onShare={() => handleShare(articleSlug, '')}
        onBookmark={handleBookmark}
      />

      <CommentsSection
        comments={comments}
        totalComments={totalComments || initialCommentsCount}
        hasMoreComments={hasMoreComments}
        isLoadingMoreComments={isFetchingMoreComments}
        isAuthenticated={!!userId}
        currentUserId={userId}
        isPostingComment={commentMutation.isPending}
        isUpdatingComment={updateCommentMutation.isPending}
        deletingCommentId={deleteCommentMutation.isPending ? (deleteCommentMutation.variables as string) : null}
        onPostComment={handlePostComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onLoadMoreComments={loadMoreComments}
      />
    </>
  );
}
