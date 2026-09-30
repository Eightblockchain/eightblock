'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function SignedInRedirect({ to }: { to: string }) {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace(to);
  }, [user, to, router]);

  return null;
}
