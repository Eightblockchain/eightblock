'use client';

import { ArticleEngagement } from '@/components/articles/article-engagement';
import { CommentsSection } from '@/components/articles/comments-section';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { SupportCreator } from '@/components/support/support-creator';
import type { SupportWallet } from '@/lib/support-wallets';
import { useArticleInteractions } from '@/hooks/useArticleInteractions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SignInDialog } from '@/components/auth/sign-in-dialog';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Edit2 } from 'lucide-react';

interface ArticleClientWrapperProps {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  authorId: string | null;
  initialLikesCount: number;
  initialCommentsCount: number;
  isPublished: boolean;
  supportWallets: SupportWallet[];
}

export function ArticleClientWrapper({
  articleId,
  articleSlug,
  articleTitle,
  authorId,
  initialLikesCount,
  initialCommentsCount,
  isPublished,
  supportWallets,
}: ArticleClientWrapperProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [signInOpen, setSignInOpen] = useState(false);

  // Get authenticated user using React Query
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const userId = currentUser?.id || null;
  const isOwner = !!userId && !!authorId && userId === authorId;

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
    onAuthRequired: () => setSignInOpen(true),
  });

  // Once we know the user's like status, correct the count if the ISR-cached
  // initialLikesCount is stale (e.g. user liked the article after the last revalidation
  // so the server-rendered count is 0 even though userLiked = true).
  const countCorrectedRef = useRef(false);
  useEffect(() => {
    if (countCorrectedRef.current) return;
    // Wait until we know who the reader is and whether they already clapped.
    if (isCurrentUserLoading || isUserLikedLoading) return;
    countCorrectedRef.current = true;
    if (userLiked && likesCount === 0) {
      // The ISR page was cached before this user's like: bump to at least 1.
      setLikesCount(1);
    }
  }, [isCurrentUserLoading, isUserLikedLoading, userLiked, likesCount]);

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
        <div className="container-read mb-4 flex justify-end">
          <Link
            href={`/articles/${articleSlug}/edit`}
            className="btn-pill-outline text-muted-foreground hover:text-foreground"
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
        onShare={() => handleShare(articleTitle, '')}
        onBookmark={handleBookmark}
      />

      <CommentsSection
        comments={comments}
        totalComments={totalComments || initialCommentsCount}
        hasMoreComments={hasMoreComments}
        isLoadingMoreComments={isFetchingMoreComments}
        isAuthenticated={!!userId}
        currentUserId={userId}
        canModerate={currentUser?.role === 'ADMIN' || currentUser?.role === 'EDITOR'}
        isPostingComment={commentMutation.isPending}
        isUpdatingComment={updateCommentMutation.isPending}
        deletingCommentId={
          deleteCommentMutation.isPending ? (deleteCommentMutation.variables as string) : null
        }
        onPostComment={handlePostComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onLoadMoreComments={loadMoreComments}
      />

      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        title="Sign in to save articles"
        description="Saved articles live in your account so you can pick them up on any device."
      />

      <div className="container-read space-y-6 pb-16">
        <SupportCreator wallets={supportWallets} />
        <NewsletterSignup className="lg:grid-cols-1 lg:gap-6 sm:p-8" />
      </div>
    </>
  );
}
