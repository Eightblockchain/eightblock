'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import { AUTH_CHANNEL, signInErrorMessage, type AuthMessage } from '@/lib/auth';

/** Last stop of the sign-in popup: tell the page that opened it, then close. */
export function PopupDone({ error }: { error: string | null }) {
  const [stillOpen, setStillOpen] = useState(false);

  useEffect(() => {
    const message: AuthMessage = error
      ? { source: AUTH_CHANNEL, ok: false, error }
      : { source: AUTH_CHANNEL, ok: true };

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.postMessage(message);
      channel.close();
    }
    window.opener?.postMessage(message, window.location.origin);
    window.close();

    // Browsers refuse to close windows they did not open, e.g. when this page is opened directly.
    const timer = window.setTimeout(() => setStillOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <BrandMark className="mx-auto h-8" />
        {!stillOpen ? (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finishing sign-in…
          </p>
        ) : error ? (
          <>
            <p role="alert" className="mt-8 text-sm leading-relaxed text-foreground">
              {signInErrorMessage(error)}
            </p>
            <Link href="/auth/login" className="btn-pill-outline mt-6">
              Try again
            </Link>
          </>
        ) : (
          <>
            <p className="mt-8 font-display text-xl font-semibold">You&apos;re signed in</p>
            <p className="mt-2 text-sm text-muted-foreground">You can close this window.</p>
            <Link href="/" className="btn-pill-outline mt-6">
              Continue to Eightblock
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
