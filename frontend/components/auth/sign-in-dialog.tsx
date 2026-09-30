'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { CornerMarks } from '@eightblock/ui/components/panel';
import { BrandMark } from '@eightblock/ui/components/brand-mark';
import { GoogleButton } from '@/components/auth/google-button';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function SignInDialog({
  open,
  onOpenChange,
  title = 'Sign in to continue',
  description = 'Use your Google account. It takes a few seconds and you will come right back here.',
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
          <GoogleButton className="mt-6 h-11 w-full" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
