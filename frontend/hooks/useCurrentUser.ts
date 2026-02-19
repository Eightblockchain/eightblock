'use client';

import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CurrentUser {
  id: string;
  walletAddress: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  role: string;
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
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    retry: false, // Don't retry if user is not authenticated
  });
}
