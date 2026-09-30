'use client';

import { Loader2 } from 'lucide-react';
import { GoogleIcon } from '@eightblock/ui/components/google-icon';
import { cn } from '@eightblock/ui/utils';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

export { GoogleIcon };

interface GoogleButtonProps {
  returnTo?: string;
  label?: string;
  className?: string;
  onSignedIn?: () => void;
}

export function GoogleButton({
  returnTo,
  label = 'Continue with Google',
  className,
  onSignedIn,
}: GoogleButtonProps) {
  const { start, waiting } = useGoogleSignIn({ returnTo, onSignedIn });
  return (
    <button
      type="button"
      onClick={start}
      aria-busy={waiting}
      className={cn('btn-pill-outline bg-background', className)}
    >
      {waiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      {waiting ? 'Waiting for Google…' : label}
    </button>
  );
}
