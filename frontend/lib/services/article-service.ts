import type { ArticleCategoryLink } from '@/lib/categories';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  categories?: ArticleCategoryLink[];
  status: string;
  featuredImage?: string;
  publishedAt: string;
  author: {
    id: string;
    walletAddress?: string | null;
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

export interface CreateArticleData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  /** Ids in the author's order; the first is the main category. Required to publish. */
  categoryIds: string[];
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateArticleData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  categoryIds: string[];
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';

export interface MyArticle {
  id: string;
  title: string;
  slug: string;
  description: string;
  featuredImage: string | null;
  status: ArticleStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  tags: Array<{ tag: { id: string; name: string } }>;
  categories?: ArticleCategoryLink[];
  _count: { likes: number; comments: number };
}

export interface MyArticlesResponse {
  articles: MyArticle[];
  counts: Record<'ALL' | ArticleStatus, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

// The signed-in author's own articles, drafts included.
export async function fetchMyArticles(params: {
  page: number;
  limit: number;
  status?: ArticleStatus;
}): Promise<MyArticlesResponse> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.status) query.set('status', params.status);
  const response = await fetch(`${API_URL}/articles/mine?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Could not load your articles');
  return response.json();
}

// Fetch article by slug. Sends the session cookie so authors can load their own drafts.
export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${encodeURIComponent(slug)}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'This article does not exist, or it is a draft that belongs to someone else.'
        : 'Failed to fetch article'
    );
  }

  return response.json();
}

// Create new article
export async function createArticle(data: CreateArticleData): Promise<Article> {
  const response = await fetch(`${API_URL}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create article');
  }

  return response.json();
}

// Update article
export async function updateArticle(articleId: string, data: UpdateArticleData): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update article');
  }

  return response.json();
}

// Delete article
export async function deleteArticle(articleId: string): Promise<void> {
  const response = await fetch(`${API_URL}/articles/${articleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete article');
  }
}

// Delete article image
export async function deleteArticleImage(imageUrl: string): Promise<void> {
  const response = await fetch(`${API_URL}/upload/article-image`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    console.error('Failed to delete image:', imageUrl);
  }
}

// Upload article image
export async function uploadArticleImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/upload/article-image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}
