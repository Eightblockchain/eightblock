const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type UserRole = 'ADMIN' | 'EDITOR' | 'WRITER' | 'READER';

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'READER', label: 'Reader', description: 'Reads, claps, comments and saves articles.' },
  {
    value: 'WRITER',
    label: 'Writer',
    description: 'Also writes and publishes their own articles.',
  },
  { value: 'EDITOR', label: 'Editor', description: 'Also moderates comments on the site.' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access, including this admin app.' },
];

export function isAdmin(role?: string | null) {
  return role === 'ADMIN';
}

/**
 * Starts Google sign-in on the API. The API only returns to absolute URLs on the admin
 * origin it is configured with (ADMIN_URL), so this always comes back here.
 */
export function signInWithGoogle(returnTo?: string) {
  const target = returnTo || (typeof window === 'undefined' ? '/' : window.location.href);
  const params = new URLSearchParams({ returnTo: target });
  window.location.assign(`${API_URL}/auth/google?${params.toString()}`);
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
