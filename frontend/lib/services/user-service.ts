const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  walletAddress: string;
  name: string | null;
  bio: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserStats {
  articles: number;
  bookmarks: number;
  likes: number;
  comments: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  status: string;
  featuredImage?: string;
  publishedAt: string;
  author: {
    id: string;
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

// Fetch current user profile
export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/users/me`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

// Fetch user stats
export async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch(`${API_URL}/users/me/stats`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }

  return response.json();
}

// Update user profile (basic info)
export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  email?: string;
}): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

// Upload user avatar
export async function uploadAvatar(file: File): Promise<{
  user: UserProfile;
  avatar: { size: number };
}> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  return response.json();
}

// Fetch user's articles
export async function fetchUserArticles(
  walletAddress: string,
  page = 1,
  limit = 100
): Promise<{ articles: Article[]; totalPages: number; currentPage: number }> {
  const response = await fetch(
    `${API_URL}/articles/wallet/${walletAddress}?page=${page}&limit=${limit}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user articles');
  }

  return response.json();
}

// Delete article (admin endpoint)
export async function deleteArticle(articleId: string): Promise<void> {
  const response = await fetch(`${API_URL}/articles/${articleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete article');
  }
}
