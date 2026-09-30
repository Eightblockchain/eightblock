'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CurrentUser {
  id: string;
  walletAddress: string | null;
  name: string | null;
  /** Handle for the public author page at /authors/{username}. */
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  googleAvatarUrl: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  _count: {
    articles: number;
    likes: number;
    comments: number;
  };
}

/**
 * Fetch current authenticated user from cookie-based auth
 */
async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(`${API_URL}/users/me`, {
    credentials: 'include', // Send httpOnly cookie
  });

  if (!response.ok) {
    // User not authenticated
    return null;
  }

  return response.json();
}

/**
 * Hook to get the current authenticated user
 * Returns null if not authenticated
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    // Short enough that a role granted by an admin shows up on the next focus or navigation.
    staleTime: 60 * 1000,
    retry: false, // Don't retry if user is not authenticated
  });
}
