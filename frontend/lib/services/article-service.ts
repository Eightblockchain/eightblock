const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

export interface CreateArticleData {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  featuredImageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateArticleData {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  featuredImageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

// Fetch article by slug
export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${slug}`);

  if (!response.ok) {
    throw new Error('Failed to fetch article');
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
    const error = await response.json();
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
