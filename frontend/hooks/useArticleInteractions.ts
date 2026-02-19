'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  toggleLike,
  removeLike,
  checkUserLike,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  fetchBookmarkIds,
  createBookmark,
  deleteBookmark,
  shareArticle,
} from '@/lib/article-api';
import { useToast } from '@/hooks/use-toast';

interface UseArticleInteractionsProps {
  articleId: string;
  userId: string | null;
  articleSlug: string;
  isPublished: boolean;
}

export function useArticleInteractions({
  articleId,
  userId,
  articleSlug,
  isPublished,
}: UseArticleInteractionsProps) {
  const queryClient = useQueryClient();
  const toast = useToast?.() || { toast: () => {} };

  // Check if user liked the article
  const { data: userLiked = false } = useQuery({
    queryKey: ['article-like', articleId, userId],
    queryFn: () => checkUserLike(articleId),
    enabled: !!articleId && !!userId && isPublished,
  });

  const { data: bookmarkIds = [] } = useQuery({
    queryKey: ['bookmark-ids'],
    queryFn: fetchBookmarkIds,
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const bookmarked = useMemo(() => bookmarkIds.includes(articleId), [bookmarkIds, articleId]);
  const bookmarkMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      if (!userId) throw new Error('Not authenticated');
      if (action === 'add') {
        return createBookmark(articleId);
      }
      return deleteBookmark(articleId);
    },
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: ['bookmark-ids'] });
      const previousIds = queryClient.getQueryData<string[]>(['bookmark-ids']) || [];
      const nextIds =
        action === 'add'
          ? Array.from(new Set([...previousIds, articleId]))
          : previousIds.filter((id) => id !== articleId);
      queryClient.setQueryData(['bookmark-ids'], nextIds);
      return { previousIds };
    },
    onSuccess: (_data, action) => {
      toast.toast?.({
        title: action === 'add' ? 'Article saved!' : 'Bookmark removed',
        description:
          action === 'add' ? 'Added to your bookmarks' : 'Article removed from your saved items',
      });
    },
    onError: (error, _action, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(['bookmark-ids'], context.previousIds);
      }
      toast.toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update bookmark',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-ids'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  // Fetch comments with manual infinite loading
  const {
    data: commentPages,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasMoreComments = false,
    isFetchingNextPage: isFetchingMoreComments,
  } = useInfiniteQuery({
    queryKey: ['article-comments', articleId],
    queryFn: ({ pageParam = undefined }) =>
      fetchComments(articleId, pageParam as string | undefined),
    getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!articleId && isPublished,
  });

  const comments = commentPages?.pages.flatMap((page: any) => page.comments) ?? [];
  const totalComments = (commentPages?.pages[0] as any)?.totalCount ?? 0;

  const loadMoreComments = () => {
    if (hasMoreComments && !isFetchingMoreComments) {
      fetchNextCommentsPage();
    }
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      return userLiked ? removeLike(articleId) : toggleLike(articleId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['article-like', articleId, userId] });
      const previousLiked = queryClient.getQueryData(['article-like', articleId, userId]);
      queryClient.setQueryData(['article-like', articleId, userId], !userLiked);
      return { previousLiked };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate the specific article query
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      queryClient.invalidateQueries({ queryKey: ['article-like', articleId, userId] });

      // Invalidate all article list queries for real-time updates on homepage
      // This catches: ['articles', 'infinite'], ['trending-articles', ...], etc.
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['trending-articles'] });

      // Use previousLiked from context to show correct message
      // If previousLiked was false, user just liked. If true, user just unliked.
      const wasLiked = context?.previousLiked;
      toast.toast?.({
        title: wasLiked ? 'Like removed' : 'Article liked!',
        description: wasLiked ? 'You unliked this article' : 'Thanks for your support!',
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
      if (!userId) throw new Error('Not authenticated');
      return createComment(articleId, content);
    },
    onSuccess: () => {
      // Invalidate article-specific queries
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });

      // Invalidate all article list queries for real-time updates on homepage
      // This catches: ['articles', 'infinite'], ['trending-articles', ...], etc.
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['trending-articles'] });

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
      if (!userId) throw new Error('Not authenticated');
      return updateComment(articleId, commentId, content);
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
      if (!userId) throw new Error('Not authenticated');
      return deleteComment(articleId, commentId);
    },
    onSuccess: () => {
      // Invalidate article-specific queries
      queryClient.invalidateQueries({ queryKey: ['article-comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });

      // Invalidate all article list queries for real-time updates on homepage
      // This catches: ['articles', 'infinite'], ['trending-articles', ...], etc.
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['trending-articles'] });

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
    if (!userId) {
      toast.toast?.({
        title: 'Authentication required',
        description: 'Please connect your wallet to like this article',
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!userId) {
      toast.toast?.({
        title: 'Authentication required',
        description: 'Please connect your wallet to save this article',
      });
      return;
    }
    if (bookmarked) {
      bookmarkMutation.mutate('remove');
    } else {
      bookmarkMutation.mutate('add');
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
    totalComments,
    hasMoreComments,
    isFetchingMoreComments,
    // Mutations
    likeMutation,
    commentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    // Handlers
    handleLike,
    handleBookmark,
    handleShare,
    loadMoreComments,
  };
}
