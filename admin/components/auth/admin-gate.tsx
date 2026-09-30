'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import { GoogleIcon } from '@eightblock/ui/components/google-icon';
import { Panel } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isAdmin, signInWithGoogle, signOut } from '@/lib/auth';
import { siteConfig } from '@/lib/site-config';

function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Panel className="w-full max-w-md p-8 sm:p-10">{children}</Panel>
    </div>
  );
}

export function GateSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SignInPanel({ error, returnTo }: { error?: string | null; returnTo?: string }) {
  return (
    <GateShell>
      <BrandMark className="h-10" />
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.02em]">
        Eightblock admin
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Analytics, newsletter, users and the About page. Sign in with the Google account that has
        admin access.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-6 border-l-2 border-brand-gold bg-muted px-4 py-3 text-sm text-foreground"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => signInWithGoogle(returnTo)}
        className="btn-pill-outline mt-8 h-11 w-full bg-background"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </GateShell>
  );
}

export function NotAdminPanel({ who }: { who: string }) {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);

  return (
    <GateShell>
      <Eyebrow>Restricted</Eyebrow>
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em]">
        This app is for admins
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        You are signed in as {who}, which is not an admin account. Writers publish from the blog
        itself.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={siteConfig.siteUrl} className="btn-pill">
          Go to Eightblock
        </a>
        <button
          type="button"
          className="btn-pill-outline"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            await signOut().catch(() => undefined);
            queryClient.setQueryData(['current-user'], null);
            setLeaving(false);
          }}
        >
          {leaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Use another account
        </button>
      </div>
    </GateShell>
  );
}

/** Renders the app only for signed-in admins; the API enforces the same rule on every call. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <GateSpinner />;
  if (!user) return <SignInPanel />;
  if (!isAdmin(user.role)) return <NotAdminPanel who={user.email || user.name || 'this account'} />;
  return <>{children}</>;
}
