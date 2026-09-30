const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type UserRole = 'ADMIN' | 'EDITOR' | 'WRITER' | 'READER';

export function isAdmin(role?: string | null) {
  return role === 'ADMIN';
}

export function canWrite(role?: string | null) {
  return role === 'ADMIN' || role === 'EDITOR' || role === 'WRITER';
}

function currentPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** Backend URL that starts the Google OAuth flow and returns the reader to `returnTo`. */
export function googleSignInUrl(returnTo?: string) {
  const params = new URLSearchParams({ returnTo: returnTo || currentPath() });
  return `${API_URL}/auth/google?${params.toString()}`;
}

export function signInWithGoogle(returnTo?: string) {
  window.location.assign(googleSignInUrl(returnTo));
}

/** Link to the sign-in page, remembering where the reader was. */
export function loginHref(returnTo?: string) {
  const params = new URLSearchParams({ returnTo: returnTo || currentPath() });
  return `/auth/login?${params.toString()}`;
}

function csrfToken() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function signOut() {
  const headers = new Headers();
  const token = csrfToken();
  if (token) headers.set('X-CSRF-Token', token);
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers });
}
