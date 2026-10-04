import type { PortfolioInput } from './portfolio';

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
export type ArticleSort = 'score' | 'latest';

export interface ArticleFilters {
  /** Author username. */
  author?: string;
  /** Topic slug, matched against tags. */
  tag?: string;
  /** Category slug, such as "cardano". */
  category?: string;
}

export async function getPublishedArticlesPaginated(
  page: number = 1,
  limit: number = 10,
  sort: ArticleSort = 'score',
  filters: ArticleFilters = {}
) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (filters.author) query.set('author', filters.author);
  if (filters.tag) query.set('tag', filters.tag);
  if (filters.category) query.set('category', filters.category);
  return fetcher(`/articles?${query}`);
}

export interface PublishedTopic {
  name: string;
  slug: string;
  count: number;
}

export async function getPublishedTopics(author?: string): Promise<PublishedTopic[]> {
  return fetcher(`/articles/topics${author ? `?author=${encodeURIComponent(author)}` : ''}`);
}

/**
 * Fetch article by slug
 */
export async function getArticleBySlug(slug: string) {
  return fetcher(`/articles/${slug}`);
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

export interface SubscribeResponse {
  email: string;
  /**
   * `confirmation_sent`: nothing is sent until the link in that email is clicked.
   * `subscribed`/`resubscribed`: only for a signed-in reader's own address, which Google verified.
   * `already_subscribed` changes nothing and sends no email.
   */
  result: 'subscribed' | 'resubscribed' | 'already_subscribed' | 'confirmation_sent';
  /** Whether an email (confirmation or welcome) is on its way. */
  emailSent: boolean;
}

export async function subscribeToNewsletter(
  email: string,
  topics: string[] = []
): Promise<SubscribeResponse> {
  return fetcher('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ email, topics }),
  });
}

/** The signed-in user's own newsletter status. */
export async function getMySubscription(): Promise<{ email: string | null; subscribed: boolean }> {
  return fetcher('/subscriptions/me');
}

export async function confirmNewsletterSubscription(
  token: string
): Promise<{ email: string; result: 'subscribed' | 'resubscribed' | 'already_subscribed' }> {
  return fetcher('/subscriptions/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function unsubscribeFromNewsletter(token: string) {
  return fetcher('/subscriptions/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function getSubscriptionStats() {
  return fetcher('/subscriptions/stats');
}

export async function updateMyProfile(data: {
  name?: string;
  bio?: string;
  username?: string;
  avatar?: 'google' | 'none';
}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const csrfToken = getBrowserCsrfToken();
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);

  const res = await fetch(`${API_URL}/users/me`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Could not save your profile');
  }
  return res.json();
}

export async function uploadMyAvatar(file: File) {
  const body = new FormData();
  body.append('avatar', file);
  const headers = new Headers();
  const csrfToken = getBrowserCsrfToken();
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);

  const res = await fetch(`${API_URL}/users/me/avatar`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Upload failed');
  }
  return res.json();
}

export async function savePortfolio(data: PortfolioInput) {
  return fetcher('/portfolio', { method: 'PUT', body: JSON.stringify(data) });
}
