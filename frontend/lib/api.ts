const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const CSRF_COOKIE_NAME = 'csrf_token';

function getBrowserCsrfToken() {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function fetcher(path: string, init?: RequestInit) {
  try {
    const headers = new Headers(init?.headers ?? {});
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

    const csrfToken = getBrowserCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    const res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers,
      ...init,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error (${res.status}):`, errorText);
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    return res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Fetch all published articles (legacy - without pagination)
 */
export async function getPublishedArticles() {
  return fetcher('/articles');
}

/**
 * Fetch published articles with pagination
 */
export async function getPublishedArticlesPaginated(page: number = 1, limit: number = 10) {
  return fetcher(`/articles?page=${page}&limit=${limit}`);
}

/**
 * Fetch article by slug
 */
export async function getArticleBySlug(slug: string) {
  return fetcher(`/articles/${slug}`);
}

/**
 * Fetch all articles for a specific wallet (includes drafts for owner)
 */
export async function getArticlesByWallet(walletAddress: string) {
  return fetcher(`/articles/wallet/${walletAddress}`);
}

/**
 * Fetch user by wallet address
 */
export async function getUserByWallet(walletAddress: string) {
  return fetcher(`/users/${walletAddress}`);
}

export interface PublicProfileStats {
  articles: number;
  views: number;
  uniqueViews: number;
  likes: number;
}

export interface PublicProfileArticle {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  featuredImage?: string | null;
  status: 'PUBLISHED';
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
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
}

export interface PublicProfileResponse {
  profile: {
    id: string;
    walletAddress: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    joinedAt: string;
    stats: PublicProfileStats;
  };
  articles: PublicProfileArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function getPublicProfile(
  walletAddress: string,
  page: number = 1,
  limit: number = 6
): Promise<PublicProfileResponse> {
  const search = new URLSearchParams({ page: String(page), limit: String(limit) });
  return fetcher(`/users/public/${walletAddress}?${search.toString()}`);
}

/**
 * Create or update user
 */
export async function upsertUser(data: {
  walletAddress: string;
  name?: string;
  bio?: string;
  avatarUrl?: string | null;
  email?: string | null;
}) {
  return fetcher('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Create article
 */
export async function createArticle(data: {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  authorId: string;
  status?: 'DRAFT' | 'PUBLISHED';
  tagIds?: string[];
}) {
  return fetcher('/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update article
 */
export async function updateArticle(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    content: string;
    category: string;
    status: 'DRAFT' | 'PUBLISHED';
    tagIds: string[];
  }>
) {
  return fetcher(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete article
 */
export async function deleteArticle(id: string) {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to delete article');
  }

  // 204 No Content doesn't have a response body
  return;
}
