'use client';

import { ArticleEngagement } from '@/components/articles/article-engagement';
import { CommentsSection } from '@/components/articles/comments-section';
import { useArticleTracking } from '@/hooks/useArticleTracking';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useState } from 'react';

interface ArticleClientWrapperProps {
  articleId: string;
  articleSlug: string;
  initialLikesCount: number;
  initialCommentsCount: number;
  isPublished: boolean;
}

export function ArticleClientWrapper({
  articleId,
  articleSlug,
  initialLikesCount,
  initialCommentsCount,
  isPublished,
}: ArticleClientWrapperProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);

  // Get authenticated user using React Query
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id || null;

  // Track article view (automatic on mount)
  useArticleTracking({
    articleId,
    enabled: isPublished,
  });

  // Get article interactions (likes, comments, bookmarks)
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
    articleId,
    userId,
    articleSlug,
    isPublished,
  });

  // Update likes count optimistically when user likes/unlikes
  const handleLikeWithOptimisticUpdate = () => {
    // Optimistically update the count
    setLikesCount((prev) => (userLiked ? prev - 1 : prev + 1));
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
        isDeletingComment={deleteCommentMutation.isPending}
        onPostComment={handlePostComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onLoadMoreComments={loadMoreComments}
      />
    </>
  );
}
