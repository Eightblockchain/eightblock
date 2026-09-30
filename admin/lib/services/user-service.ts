import type { UserRole } from '@/lib/auth';
import { ApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  /** Listed in ADMIN_EMAILS, so the role is re-applied at every sign-in. */
  managedByConfig: boolean;
  _count: { articles: number };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  counts: Record<'ALL' | UserRole, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}

function csrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? { 'X-CSRF-Token': decodeURIComponent(match[1]) } : {};
}

async function apiError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return new ApiError(typeof body?.error === 'string' ? body.error : fallback, response.status);
}

export async function fetchUsers(params: {
  page: number;
  limit: number;
  q?: string;
  role?: UserRole;
}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
  if (params.q) query.set('q', params.q);
  if (params.role) query.set('role', params.role);
  const response = await fetch(`${API_URL}/users?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw await apiError(response, 'Could not load users');
  return response.json();
}

export async function updateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...csrfHeader() },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw await apiError(response, 'Could not change the role');
  return response.json();
}
