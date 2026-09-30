'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import {
  AUTH_CHANNEL,
  googleSignInUrl,
  isAuthMessage,
  signInErrorMessage,
  signInWithGoogle,
  type AuthMessage,
} from '@/lib/auth';

const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 640;

function popupFeatures() {
  const left = window.screenX + Math.max(0, (window.outerWidth - POPUP_WIDTH) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - POPUP_HEIGHT) / 2);
  return `popup,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`;
}

interface UseGoogleSignInOptions {
  /** Where to land if the browser blocks the popup and we fall back to a full redirect. */
  returnTo?: string;
  onSignedIn?: () => void;
}

/**
 * Signs in with Google in a popup so the reader never leaves the page. Google refuses to be
 * framed, so a popup is the closest we can get to an in-page modal.
 */
export function useGoogleSignIn({ returnTo, onSignedIn }: UseGoogleSignInOptions = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [waiting, setWaiting] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useEffect(() => () => stopRef.current?.(), []);

  const start = useCallback(() => {
    stopRef.current?.();

    const popup = window.open(googleSignInUrl('/', { popup: true }), AUTH_CHANNEL, popupFeatures());
    if (!popup) {
      signInWithGoogle(returnTo);
      return;
    }
    popup.focus();
    setWaiting(true);

    let settled = false;
    const finish = async (message: AuthMessage) => {
      if (settled) return;
      settled = true;
      stop();
      setWaiting(false);
      if (!message.ok) {
        toast({
          title: message.error === 'cancelled' ? 'Sign-in cancelled' : 'Could not sign you in',
          description: signInErrorMessage(message.error),
          variant: message.error === 'cancelled' ? 'default' : 'destructive',
        });
        return;
      }
      await queryClient.invalidateQueries();
      toast({ title: "You're signed in", variant: 'success' });
      onSignedInRef.current?.();
    };

    // Google cuts the popup off from `window.opener` on the way back, so /auth/done reports
    // over a BroadcastChannel; postMessage covers browsers without one.
    const channel =
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(AUTH_CHANNEL);
    if (channel)
      channel.onmessage = (event) => isAuthMessage(event.data) && void finish(event.data);
    const onWindowMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && isAuthMessage(event.data)) {
        void finish(event.data);
      }
    };
    window.addEventListener('message', onWindowMessage);

    // `closed` also turns true once the popup is cut off, so it only clears the waiting state;
    // the listeners stay up in case the result is still on its way.
    const poll = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poll);
        setWaiting(false);
      }
    }, 500);

    function stop() {
      channel?.close();
      window.removeEventListener('message', onWindowMessage);
      window.clearInterval(poll);
      stopRef.current = null;
    }
    stopRef.current = stop;
  }, [queryClient, returnTo, toast]);

  return { start, waiting };
}
