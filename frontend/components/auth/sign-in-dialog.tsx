'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { CornerMarks } from '@eightblock/ui/components/panel';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import { GoogleButton } from '@/components/auth/google-button';

interface SignInCopy {
  title?: string;
  description?: string;
}

interface SignInDialogProps extends SignInCopy {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInDialog({
  open,
  onOpenChange,
  title = 'Sign in to Eightblock',
  description = 'Comment on articles and save the ones you want to read later. Google opens in a small window and you stay right here.',
}: SignInDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[95] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-7 focus:outline-none">
          <CornerMarks className="text-foreground/70" />
          <Dialog.Close
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
          <BrandMark className="h-8" />
          <Dialog.Title className="mt-6 font-display text-xl font-semibold tracking-[-0.01em]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </Dialog.Description>
          <GoogleButton className="mt-6 h-11 w-full" onSignedIn={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const SignInDialogContext = createContext<((copy?: SignInCopy) => void) | null>(null);

/** One sign-in dialog for the whole site, so any button can open it without leaving the page. */
export function SignInDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<SignInCopy>({});

  const openSignIn = useCallback((next: SignInCopy = {}) => {
    setCopy(next);
    setOpen(true);
  }, []);

  return (
    <SignInDialogContext.Provider value={openSignIn}>
      {children}
      <SignInDialog open={open} onOpenChange={setOpen} {...copy} />
    </SignInDialogContext.Provider>
  );
}

export function useSignInDialog() {
  const openSignIn = useContext(SignInDialogContext);
  if (!openSignIn) throw new Error('useSignInDialog must be used inside SignInDialogProvider');
  return openSignIn;
}
