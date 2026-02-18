'use client';

import { useEffect, useState } from 'react';
import { ArticleEngagement } from '@/components/articles/article-engagement';
import { CommentsSection } from '@/components/articles/comments-section';
import { useArticleTracking } from '@/hooks/useArticleTracking';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';

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
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from localStorage (set during wallet authentication)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId);
    }
  }, []);

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
        likesCount={initialLikesCount}
        commentsCount={totalComments || initialCommentsCount}
        userLiked={userLiked}
        bookmarked={bookmarked}
        isLiking={likeMutation.isPending}
        onLike={handleLike}
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
