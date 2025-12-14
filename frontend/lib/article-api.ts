const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    walletAddress: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface PaginatedCommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
  totalCount: number;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  featuredImage?: string | null;
  publishedAt: string;
  author: {
    id?: string;
    walletAddress: string;
    name: string | null;
    avatarUrl: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

// Like/Unlike Article
export async function toggleLike(articleId: string) {
  const response = await fetch(`${API_URL}/articles/${articleId}/likes`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle like');
  }

  return response.json();
}

export async function removeLike(articleId: string) {
  const response = await fetch(`${API_URL}/articles/${articleId}/likes`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove like' }));
    throw new Error(error.error || 'Failed to remove like');
  }

  // 204 No Content returns empty body, just return success
  return { success: true };
}

// Check if user liked article
export async function checkUserLike(articleId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/articles/${articleId}/likes`, {
      credentials: 'include',
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.liked || false;
  } catch {
    return false;
  }
}

// Comments
export async function fetchComments(
  articleId: string,
  cursor?: string,
  limit = 5
): Promise<PaginatedCommentsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }

  const url = `${API_URL}/articles/${articleId}/comments?${params.toString()}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  return response.json();
}

export async function createComment(articleId: string, content: string): Promise<Comment> {
  const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create comment');
  }

  return response.json();
}

export async function updateComment(
  articleId: string,
  commentId: string,
  content: string
): Promise<Comment> {
  const response = await fetch(`${API_URL}/articles/${articleId}/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update comment');
  }

  return response.json();
}

export async function deleteComment(articleId: string, commentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/articles/${articleId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete comment' }));
    throw new Error(error.error || 'Failed to delete comment');
  }
}

// Bookmarks API
export async function fetchBookmarkIds(): Promise<string[]> {
  const response = await fetch(`${API_URL}/bookmarks/ids`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch bookmark ids' }));
    throw new Error(error.error || 'Failed to fetch bookmark ids');
  }

  const data = await response.json();
  return data.articleIds || [];
}

export async function fetchBookmarkedArticles(): Promise<ArticleSummary[]> {
  const response = await fetch(`${API_URL}/bookmarks`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch bookmarks' }));
    throw new Error(error.error || 'Failed to fetch bookmarks');
  }

  const data = await response.json();
  return (data.bookmarks || []).map((bookmark: { article: ArticleSummary }) => bookmark.article);
}

export async function createBookmark(articleId: string): Promise<void> {
  const response = await fetch(`${API_URL}/bookmarks`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ articleId }),
  });

  if (response.status === 401) {
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add bookmark' }));
    throw new Error(error.error || 'Failed to add bookmark');
  }
}

export async function deleteBookmark(articleId: string): Promise<void> {
  const response = await fetch(`${API_URL}/bookmarks/${articleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('Authentication required');
  }

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove bookmark' }));
    throw new Error(error.error || 'Failed to remove bookmark');
  }
}

// Share functionality
export async function shareArticle(
  title: string,
  description: string,
  url: string
): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: description,
        url,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
