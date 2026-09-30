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
import { useToast } from '@eightblock/ui/hooks/use-toast';

interface UseArticleInteractionsProps {
  articleId: string;
  userId: string | null;
  articleSlug: string;
  isPublished: boolean;
  /** Called when a signed-out reader tries something that needs an account (saving). */
  onAuthRequired?: () => void;
}

export function useArticleInteractions({
  articleId,
  userId,
  articleSlug,
  isPublished,
  onAuthRequired,
}: UseArticleInteractionsProps) {
  const queryClient = useQueryClient();
  const toast = useToast?.() || { toast: () => {} };

  // Claps work for signed-in readers and anonymous visitors (tracked by a backend cookie)
  const likeKey = ['article-like', articleId, userId ?? 'visitor'];
  const { data: userLiked = false, isLoading: isUserLikedLoading } = useQuery({
    queryKey: likeKey,
    queryFn: () => checkUserLike(articleId),
    enabled: !!articleId && isPublished,
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
        title: action === 'add' ? 'Saved' : 'Removed from saved',
        description:
          action === 'add'
            ? 'Find it any time under Saved articles in your account menu.'
            : 'This article is no longer in your saved list.',
        variant: 'success',
      });
    },
    onError: (error, _action, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(['bookmark-ids'], context.previousIds);
      }
      toast.toast?.({
        title: 'Could not update saved articles',
        description: error instanceof Error ? error.message : 'Please try again.',
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
      return userLiked ? removeLike(articleId) : toggleLike(articleId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: likeKey });
      const previousLiked = queryClient.getQueryData<boolean>(likeKey);
      queryClient.setQueryData(likeKey, !userLiked);
      return { previousLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleSlug] });
      queryClient.invalidateQueries({ queryKey: likeKey });

      // Reset feeds so mounted components refetch immediately with fresh score ordering
      queryClient.resetQueries({ queryKey: ['articles', 'infinite'] });
      queryClient.resetQueries({ queryKey: ['trending-articles'] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(likeKey, context.previousLiked);
      }
      toast.toast?.({
        title: 'Could not register your clap',
        description: 'Please try again in a moment.',
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

      // Reset feeds so mounted components refetch immediately with fresh score ordering
      queryClient.resetQueries({ queryKey: ['articles', 'infinite'] });
      queryClient.resetQueries({ queryKey: ['trending-articles'] });

      toast.toast?.({
        title: 'Comment posted',
        description: 'Thanks for joining the discussion.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Could not post your comment',
        description: error instanceof Error ? error.message : 'Please try again.',
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
        title: 'Comment updated',
        description: 'Your changes are live.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Could not update your comment',
        description: error instanceof Error ? error.message : 'Please try again.',
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
        title: 'Comment deleted',
        description: 'Your comment has been removed.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast.toast?.({
        title: 'Could not delete your comment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!userId) {
      onAuthRequired?.();
      return;
    }
    if (bookmarked) {
      bookmarkMutation.mutate('remove');
    } else {
      bookmarkMutation.mutate('add');
    }
  };

  const handleShare = async (title: string, description: string) => {
    return shareArticle(title, description, window.location.href);
  };

  return {
    // State
    userLiked,
    isUserLikedLoading,
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
