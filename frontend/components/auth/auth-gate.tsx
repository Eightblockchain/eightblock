'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { GoogleButton } from '@/components/auth/google-button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canWrite } from '@/lib/auth';

type Requirement = 'user' | 'writer';

interface AuthGateProps {
  require?: Requirement;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

function allowed(requirement: Requirement, role: string) {
  if (requirement === 'writer') return canWrite(role);
  return true;
}

function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Panel className="w-full max-w-md p-8 sm:p-10">{children}</Panel>
    </div>
  );
}

/** Renders children only for signed-in readers with the required role. */
export function AuthGate({
  require = 'user',
  title = 'Sign in to continue',
  description = 'Use your Google account to continue.',
  children,
}: AuthGateProps) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <GateShell>
        <Eyebrow>Account</Eyebrow>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <GoogleButton className="mt-8 h-11 w-full" />
      </GateShell>
    );
  }

  if (!allowed(require, user.role)) {
    const who = user.email || user.name;
    return (
      <GateShell>
        <Eyebrow>Restricted</Eyebrow>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em]">
          {require === 'writer'
            ? 'Writing is by invitation'
            : 'This area is for the editorial team'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {require === 'writer'
            ? `You are signed in as ${who}. Ask an admin to give your account writer access, then reload this page.`
            : `You are signed in as ${who}, which does not have access to this page.`}
        </p>
        <Link href="/" className="btn-pill mt-8">
          Back to Eightblock
        </Link>
      </GateShell>
    );
  }

  return <>{children}</>;
}
