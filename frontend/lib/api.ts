const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetcher(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
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

/**
 * Create or update user
 */
export async function upsertUser(data: { walletAddress: string; name?: string }) {
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
  return fetcher(`/articles/${id}`, {
    method: 'DELETE',
  });
}
