import type { PortfolioInput } from './portfolio';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function csrfToken() {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Carries the HTTP status, so callers can tell a rejected request from an outage. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetcher(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  const token = csrfToken();
  if (token) headers.set('X-CSRF-Token', token);

  const res = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new ApiError(`API error: ${res.status} - ${errorText}`, res.status);
  }
  return res.json();
}

export async function savePortfolio(data: PortfolioInput) {
  return fetcher('/portfolio', { method: 'PUT', body: JSON.stringify(data) });
}
