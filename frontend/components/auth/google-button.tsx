'use client';

import { GoogleIcon } from '@eightblock/ui/components/google-icon';
import { cn } from '@eightblock/ui/utils';
import { signInWithGoogle } from '@/lib/auth';

export { GoogleIcon };

interface GoogleButtonProps {
  returnTo?: string;
  label?: string;
  className?: string;
}

export function GoogleButton({
  returnTo,
  label = 'Continue with Google',
  className,
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signInWithGoogle(returnTo)}
      className={cn('btn-pill-outline bg-background', className)}
    >
      <GoogleIcon />
      {label}
    </button>
  );
}
