'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  Send,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { PageViewTracker } from '@/lib/view-tracking';
import { useWallet } from '@/lib/wallet-context';
import {
  toggleLike,
  removeLike,
  checkUserLike,
  fetchComments,
  createComment,
  isBookmarked,
  addBookmark,
  removeBookmark,
  shareArticle,
  type Comment,
} from '@/lib/article-api';
import { useToast } from '@/hooks/use-toast';

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
  viewCount: number;
  uniqueViews: number;
  author: {
    id: string;
    walletAddress: string;
    name: string | null;
    bio?: string | null;
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

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [slug, setSlug] = useState<string>('');
  const [commentText, setCommentText] = useState('');
  const router = useRouter();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast?.() || { toast: () => {} };
  const viewTrackerRef = useRef<PageViewTracker | null>(null);

  // Get auth token and userId from localStorage
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const id = localStorage.getItem('userId');
    setAuthToken(token);
    setUserId(id);
  }, [address]);

  useEffect(() => {
    Promise.resolve(params).then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch article
  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticle(slug),
    enabled: !!slug,
    retry: false,
  });

  // Check if user liked the article
  const { data: userLiked = false } = useQuery({
    queryKey: ['article-like', article?.id, userId],
    queryFn: () => checkUserLike(article!.id, userId!),
    enabled: !!article?.id && !!userId && !!authToken,
  });

  // Initialize view tracking
  useEffect(() => {
    if (article?.id && !viewTrackerRef.current) {
      viewTrackerRef.current = new PageViewTracker(article.id);
    }

    // Cleanup on unmount
    return () => {
      if (viewTrackerRef.current) {
        viewTrackerRef.current.track();
        viewTrackerRef.current = null;
      }
    };
  }, [article?.id]);

  // Check if article is bookmarked
  const [bookmarked, setBookmarked] = useState(false);
  useEffect(() => {
    if (article?.id) {
      setBookmarked(isBookmarked(article.id));
    }
  }, [article?.id]);

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['article-comments', article?.id],
    queryFn: () => fetchComments(article!.id),
    enabled: !!article?.id,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!article || !userId || !authToken) throw new Error('Not authenticated');

      if (userLiked) {
        return removeLike(article.id, userId, authToken);
      } else {
        return toggleLike(article.id, userId, authToken);
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['article-like', article?.id, userId] });

      // Snapshot the previous value
      const previousLiked = queryClient.getQueryData(['article-like', article?.id, userId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['article-like', article?.id, userId], !userLiked);

      return { previousLiked };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
      queryClient.invalidateQueries({ queryKey: ['article-like', article?.id, userId] });
      toast.toast?.({
        title: userLiked ? 'Article liked!' : 'Like removed',
        description: userLiked ? 'Thanks for your support!' : 'You unliked this article',
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(['article-like', article?.id, userId], context.previousLiked);
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
      if (!article || !userId || !authToken) throw new Error('Not authenticated');
      return createComment(article.id, content, userId, authToken);
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['article-comments', article?.id] });
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
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
    if (!article) return;

    if (bookmarked) {
      removeBookmark(article.id);
      setBookmarked(false);
      toast.toast?.({
        title: 'Bookmark removed',
        description: 'Article removed from your saved items',
      });
    } else {
      addBookmark(article.id);
      setBookmarked(true);
      toast.toast?.({
        title: 'Article saved!',
        description: 'Added to your bookmarks',
      });
    }
  };

  const handleShare = async () => {
    if (!article) return;

    const success = await shareArticle(article.title, article.description, window.location.href);

    if (success) {
      toast.toast?.({
        title: 'Shared!',
        description: navigator.share ? 'Article shared successfully' : 'Link copied to clipboard',
      });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!userId || !authToken) {
      toast.toast?.({
        title: 'Authentication required',
        description: 'Please connect your wallet to comment',
      });
      return;
    }

    commentMutation.mutate(commentText.trim());
  };

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

  const likesCount =
    (article._count?.likes || 0) +
    (userLiked && !likeMutation.isPending ? 0 : likeMutation.isPending && !userLiked ? 1 : 0);

  // Format content with better structure
  const formatContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(Boolean);

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();

      // Check for heading patterns (lines starting with #)
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={index} className="mt-8 mb-4 text-3xl font-bold">
            {trimmed.substring(2)}
          </h2>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={index} className="mt-6 mb-3 text-2xl font-bold">
            {trimmed.substring(3)}
          </h3>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={index} className="mt-4 mb-2 text-xl font-semibold">
            {trimmed.substring(4)}
          </h4>
        );
      }

      // Check for list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = paragraph
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'));
        return (
          <ul key={index} className="my-4 space-y-2 list-disc list-inside">
            {items.map((item, i) => (
              <li key={i}>{item.substring(2).trim()}</li>
            ))}
          </ul>
        );
      }

      // Regular paragraphs
      const lines = trimmed.split('\n').filter(Boolean);
      return (
        <div key={index} className="my-4">
          {lines.map((line, i) => (
            <p key={i} className="mb-2 last:mb-0 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      );
    });
  };

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
              {article.viewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{article.viewCount.toLocaleString()} views</span>
                </div>
              )}
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
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-strong:font-semibold prose-strong:text-gray-900 prose-em:italic prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-ul:list-disc prose-ul:my-4 prose-ul:space-y-2 prose-li:text-gray-700 prose-ol:list-decimal">
          {formatContent(article.content)}
        </div>
      </article>

      {/* Reactions & Engagement Section */}
      <div className="border-t border-b bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Reaction Stats */}
          <div className="mb-6 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span>{likesCount} likes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>{comments.length} comments</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={userLiked ? 'default' : 'outline'}
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 transition-all ${
                userLiked
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
              }`}
            >
              {likeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 transition-all ${userLiked ? 'fill-current scale-110' : ''}`}
                />
              )}
              {userLiked ? 'Liked' : 'Like'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const commentsSection = document.getElementById('comments');
                commentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Comment
            </Button>

            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant={bookmarked ? 'default' : 'outline'}
              onClick={handleBookmark}
              className="flex items-center gap-2"
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Author Section */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">About the Author</h3>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {(article.author.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {article.author.name || 'Anonymous Author'}
              </p>
              {article.author.bio && (
                <p className="mt-1 text-sm text-gray-600">{article.author.bio}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 font-mono">
                {article.author.walletAddress.substring(0, 20)}...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments" className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h3 className="mb-6 text-2xl font-bold text-gray-900">Comments ({comments.length})</h3>

          {!address ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Connect your wallet to join the discussion</p>
              <Button>Connect Wallet</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comment Input */}
              <form
                onSubmit={handleCommentSubmit}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full resize-none border-0 p-2 focus:outline-none focus:ring-0"
                  rows={3}
                  disabled={commentMutation.isPending}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCommentText('')}
                    disabled={commentMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    {commentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          {(comment.author.name || 'A')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {comment.author.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{comment.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
