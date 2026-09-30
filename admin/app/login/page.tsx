'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GateSpinner, NotAdminPanel, SignInPanel } from '@/components/auth/admin-gate';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isAdmin } from '@/lib/auth';

const ERRORS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. You can try again whenever you like.',
  state: 'Your sign-in session expired. Please try again.',
  failed: 'We could not sign you in with Google. Please try again.',
  not_configured: 'Google sign-in is not configured on the server yet.',
};

/** Only paths on this app; anything else lands on the overview. */
function localPath(value: string | null) {
  if (!value || typeof window === 'undefined') return '/';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith('/login')) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

function Login() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const target = localPath(params.get('returnTo'));
  const errorKey = params.get('error');
  const admin = isAdmin(user?.role);

  useEffect(() => {
    if (admin) router.replace(target);
  }, [admin, target, router]);

  if (isLoading || admin) return <GateSpinner />;
  if (user) return <NotAdminPanel who={user.email || user.name || 'this account'} />;
  return (
    <SignInPanel
      error={errorKey ? (ERRORS[errorKey] ?? ERRORS.failed) : null}
      returnTo={typeof window === 'undefined' ? undefined : `${window.location.origin}${target}`}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<GateSpinner />}>
      <Login />
    </Suspense>
  );
}
