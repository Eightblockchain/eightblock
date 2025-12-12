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

// Like/Unlike Article
export async function toggleLike(articleId: string, userId: string) {
  const response = await fetch(`${API_URL}/articles/${articleId}/likes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle like');
  }

  return response.json();
}

export async function removeLike(articleId: string, userId: string) {
  const response = await fetch(`${API_URL}/articles/${articleId}/likes`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove like' }));
    throw new Error(error.error || 'Failed to remove like');
  }

  // 204 No Content returns empty body, just return success
  return { success: true };
}

// Check if user liked article
export async function checkUserLike(articleId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/articles/${articleId}/likes?userId=${userId}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.liked || false;
  } catch {
    return false;
  }
}

// Comments
export async function fetchComments(articleId: string): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/articles/${articleId}/comments`);
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  return response.json();
}

export async function createComment(
  articleId: string,
  content: string,
  userId: string
): Promise<Comment> {
  const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: content, authorId: userId }),
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

// Bookmarks (using localStorage for now, can be replaced with API)
export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('bookmarked_articles');
  return saved ? JSON.parse(saved) : [];
}

export function addBookmark(articleId: string): void {
  const bookmarks = getBookmarks();
  if (!bookmarks.includes(articleId)) {
    bookmarks.push(articleId);
    localStorage.setItem('bookmarked_articles', JSON.stringify(bookmarks));
  }
}

export function removeBookmark(articleId: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((id) => id !== articleId);
  localStorage.setItem('bookmarked_articles', JSON.stringify(filtered));
}

export function isBookmarked(articleId: string): boolean {
  return getBookmarks().includes(articleId);
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
