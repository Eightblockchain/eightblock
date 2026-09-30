'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CurrentUser {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
  role: UserRole;
}

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(`${API_URL}/users/me`, { credentials: 'include' });
  if (!response.ok) return null;
  return response.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    // Short enough that a role change made in another tab shows up on the next focus.
    staleTime: 60 * 1000,
    retry: false,
  });
}
