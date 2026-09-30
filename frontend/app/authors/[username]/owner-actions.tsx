'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/** Shortcuts shown only to the author looking at their own page. */
export function OwnerActions({ authorId }: { authorId: string }) {
  const { data: user } = useCurrentUser();
  if (user?.id !== authorId) return null;

  return (
    <>
      <Link href="/settings" className="btn-pill-outline">
        <Pencil className="h-4 w-4" />
        Edit profile
      </Link>
      <Link href="/my-articles" className="btn-pill-outline">
        My articles
      </Link>
    </>
  );
}
