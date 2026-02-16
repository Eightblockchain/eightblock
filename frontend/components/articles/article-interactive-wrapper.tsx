'use client';

import { useState, useEffect } from 'react';
import { ArticleEngagement } from '@/components/articles/article-engagement';
import { CommentsSection } from '@/components/articles/comments-section';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/article-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ArticleInteractiveWrapperProps {
  articleId: string;
  initialLikesCount: number;
  initialCommentsCount: number;
}

export function ArticleInteractiveWrapper({
  articleId,
  initialLikesCount,
  initialCommentsCount,
}: ArticleInteractiveWrapperProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
          setIsAuthenticated(true);
          // Fetch user profile to get user ID
          const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
          });
          if (response.ok) {
            const user = await response.json();
            setCurrentUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const response = await fetch(`${API_URL}/articles/${articleId}/comments?page=1&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          setHasMoreComments(data.hasMore || false);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };
    fetchComments();
  }, [articleId]);

  // Check if user liked the article
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(`${API_URL}/articles/${articleId}/like-status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserLiked(data.liked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    checkLikeStatus();
  }, [articleId, isAuthenticated]);

  // Check if user bookmarked the article
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(`${API_URL}/articles/${articleId}/bookmark-status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setBookmarked(data.bookmarked);
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };
    checkBookmarkStatus();
  }, [articleId, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please connect your wallet to like articles',
        variant: 'destructive',
      });
      return;
    }

    setIsLiking(true);
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/like`, {
        method: userLiked ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        setUserLiked(!userLiked);
        setLikesCount((prev) => (userLiked ? prev - 1 : prev + 1));
      } else {
        throw new Error('Failed to update like');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    const commentsSection = document.getElementById('comments');
    commentsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } catch (error) {
        // User cancelled share or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Link copied!',
          description: 'Article link copied to clipboard',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy link',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please connect your wallet to bookmark articles',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
        toast({
          title: bookmarked ? 'Bookmark removed' : 'Article bookmarked',
          description: bookmarked
            ? 'Article removed from your bookmarks'
            : 'Article added to your bookmarks',
        });
      } else {
        throw new Error('Failed to update bookmark');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  };

  const handlePostComment = async (content: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please connect your wallet to comment',
        variant: 'destructive',
      });
      return;
    }

    setIsPostingComment(true);
    try {
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentsCount((prev) => prev + 1);
        toast({
          title: 'Comment posted',
          description: 'Your comment has been posted successfully',
        });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    setIsUpdatingComment(true);
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? updatedComment : comment))
        );
        toast({
          title: 'Comment updated',
          description: 'Your comment has been updated successfully',
        });
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeletingComment(true);
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        setCommentsCount((prev) => prev - 1);
        toast({
          title: 'Comment deleted',
          description: 'Your comment has been deleted successfully',
        });
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleLoadMoreComments = async () => {
    setIsLoadingMoreComments(true);
    try {
      const nextPage = commentsPage + 1;
      const response = await fetch(
        `${API_URL}/articles/${articleId}/comments?page=${nextPage}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [...prev, ...(data.comments || [])]);
        setHasMoreComments(data.hasMore || false);
        setCommentsPage(nextPage);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load more comments',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMoreComments(false);
    }
  };

  return (
    <>
      <ArticleEngagement
        likesCount={likesCount}
        commentsCount={commentsCount}
        userLiked={userLiked}
        bookmarked={bookmarked}
        isLiking={isLiking}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onBookmark={handleBookmark}
      />

      <CommentsSection
        comments={comments}
        totalComments={commentsCount}
        hasMoreComments={hasMoreComments}
        isLoadingMoreComments={isLoadingMoreComments}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        isPostingComment={isPostingComment}
        isUpdatingComment={isUpdatingComment}
        isDeletingComment={isDeletingComment}
        onPostComment={handlePostComment}
        onUpdateComment={handleUpdateComment}
        onDeleteComment={handleDeleteComment}
        onLoadMoreComments={handleLoadMoreComments}
      />
    </>
  );
}
