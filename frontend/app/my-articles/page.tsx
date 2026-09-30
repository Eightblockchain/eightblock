'use client';

import { AuthGate } from '@/components/auth/auth-gate';
import { MyArticles } from '@/components/articles/my-articles';

export default function MyArticlesPage() {
  return (
    <AuthGate
      require="writer"
      title="Sign in to see your articles"
      description="Your drafts and published articles are linked to your Google account."
    >
      <MyArticles />
    </AuthGate>
  );
}
