import type { Metadata } from 'next';
import Link from 'next/link';
import { Panel } from '@eightblock/ui/components/panel';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import { GoogleButton } from '@/components/auth/google-button';
import { signInErrorMessage } from '@/lib/auth';
import { SignedInRedirect } from './signed-in-redirect';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

function safeReturnTo(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/auth'))
    return '/';
  return path;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo ?? params.redirect);
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const error = errorKey ? signInErrorMessage(errorKey) : null;
  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
      <SignedInRedirect to={returnTo} />
      <Panel className="w-full max-w-md p-8 sm:p-10">
        <BrandMark className="h-10" />
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.02em]">
          Sign in to Eightblock
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in to comment on articles and save the ones you want to read later. Reading and
          clapping never require an account.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 border-l-2 border-brand-gold bg-muted px-4 py-3 text-sm text-foreground"
          >
            {error}
          </p>
        )}

        <GoogleButton returnTo={returnTo} className="mt-8 h-11 w-full" />

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          We only use your Google name, email and profile photo. By continuing you agree to the{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}
