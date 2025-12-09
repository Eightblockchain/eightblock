'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  toggleLike,
  removeLike,
  checkUserLike,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  isBookmarked,
  addBookmark,
  removeBookmark,
  shareArticle,
} from '@/lib/article-api';
import { useToast } from '@/hooks/use-toast';

interface UseArticleInteractionsProps {
  articleId: string;
  userId: string | null;
  authToken: string | null;
  articleSlug: string;
  isPublished: boolean;
}

export function useArticleInteractions({
  articleId,
  userId,
  authToken,
  articleSlug,
  isPublished,
}: UseArticleInteractionsProps) {
  const queryClient = useQueryClient();
  const toast = useToast?.() || { toast: () => {} };
  const [bookmarked, setBookmarked] = useState(false);

  // Check if user liked the article
  const { data: userLiked = false } = useQuery({
    queryKey: ['article-like', articleId, userId],
    queryFn: () => checkUserLike(articleId, userId!),
    enabled: !!articleId && !!userId && !!authToken && isPublished,
  });

  // Check if article is bookmarked
  useEffect(() => {
    if (articleId && isPublished) {
      setBookmarked(isBookmarked(articleId));
    }
  }, [articleId, isPublished]);

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['article-comments', articleId],
    queryFn: () => fetchComments(articleId),
    enabled: !!articleId && isPublished,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !authToken) throw new Error('Not authenticated');
      return userLiked
        ? removeLike(articleId, userId, authToken)
        : toggleLike(articleId, userId, authToken);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['article-like', articleId, userId] });
      const previousLiked = queryClient.getQueryData(['article-like', articleId, userId]);
      queryClient.setQueryData(['article-like', articleId, userId], !userLiked);
      return { previousLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      queryClient.invalidateQueries({ queryKey: ['article-like', articleId, userId] });
      toast.toast?.({
        title: userLiked ? 'Like removed' : 'Article liked!',
        description: userLiked ? 'You unliked this article' : 'Thanks for your support!',
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(['article-like', articleId, userId], context.previousLiked);
      }
      toast.toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update like',
        variant: 'destructive',
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!userId || !authToken) throw new Error('Not authenticated');
      return createComment(articleId, content, userId, authToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      toast.toast?.({
        title: 'Comment posted!',
        description: 'Your comment has been added successfully.',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment',
        variant: 'destructive',
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!authToken) throw new Error('Not authenticated');
      return updateComment(articleId, commentId, content, authToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
      toast.toast?.({
        title: 'Comment updated!',
        description: 'Your comment has been updated successfully.',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update comment',
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!authToken) throw new Error('Not authenticated');
      return deleteComment(articleId, commentId, authToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      toast.toast?.({
        title: 'Comment deleted!',
        description: 'Your comment has been removed.',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleLike = () => {
    if (!userId || !authToken) {
      toast.toast?.({
        title: 'Authentication required',
        description: 'Please connect your wallet to like this article',
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(articleId);
      setBookmarked(false);
      toast.toast?.({
        title: 'Bookmark removed',
        description: 'Article removed from your saved items',
      });
    } else {
      addBookmark(articleId);
      setBookmarked(true);
      toast.toast?.({
        title: 'Article saved!',
        description: 'Added to your bookmarks',
      });
    }
  };

  const handleShare = async (title: string, description: string) => {
    const success = await shareArticle(title, description, window.location.href);
    if (success) {
      toast.toast?.({
        title: 'Shared!',
        description:
          typeof navigator.share !== 'undefined'
            ? 'Article shared successfully'
            : 'Link copied to clipboard',
      });
    }
  };

  return {
    // State
    userLiked,
    bookmarked,
    comments,
    // Mutations
    likeMutation,
    commentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    // Handlers
    handleLike,
    handleBookmark,
    handleShare,
  };
}
