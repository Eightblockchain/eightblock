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

/**
 * Backend URL that starts the Google OAuth flow and returns the reader to `returnTo`.
 * In popup mode the flow ends on /auth/done instead, which reports back over `AUTH_CHANNEL`.
 */
export function googleSignInUrl(returnTo?: string, { popup = false } = {}) {
  const params = new URLSearchParams({ returnTo: returnTo || currentPath() });
  if (popup) params.set('mode', 'popup');
  return `${API_URL}/auth/google?${params.toString()}`;
}

export const AUTH_CHANNEL = 'eightblock-auth';

/** Sent by /auth/done to the page that opened the sign-in popup. */
export type AuthMessage =
  | { source: typeof AUTH_CHANNEL; ok: true }
  | { source: typeof AUTH_CHANNEL; ok: false; error: string };

export function isAuthMessage(value: unknown): value is AuthMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { source?: unknown }).source === AUTH_CHANNEL
  );
}

const SIGN_IN_ERRORS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. You can try again whenever you like.',
  state: 'Your sign-in session expired. Please try again.',
  failed: 'We could not sign you in with Google. Please try again.',
  not_configured: 'Google sign-in is not configured on the server yet.',
};

export function signInErrorMessage(code: string) {
  return SIGN_IN_ERRORS[code] ?? SIGN_IN_ERRORS.failed;
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
