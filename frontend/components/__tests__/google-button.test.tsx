import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleButton } from '@/components/auth/google-button';
import { AUTH_CHANNEL, signInWithGoogle, type AuthMessage } from '@/lib/auth';

const toast = vi.fn();
vi.mock('@eightblock/ui/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  signInWithGoogle: vi.fn(),
}));

function renderButton(onSignedIn = vi.fn()) {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <GoogleButton returnTo="/writing" onSignedIn={onSignedIn} />
    </QueryClientProvider>
  );
  return { invalidate, onSignedIn };
}

async function broadcast(message: AuthMessage) {
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  await act(async () => {
    channel.postMessage(message);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  channel.close();
}

describe('GoogleButton', () => {
  let open: MockInstance<typeof window.open>;

  beforeEach(() => {
    toast.mockClear();
    open = vi.spyOn(window, 'open').mockReturnValue({ closed: false, focus: vi.fn() } as never);
  });

  afterEach(() => open.mockRestore());

  it('signs in through a popup without leaving the page', async () => {
    const { invalidate, onSignedIn } = renderButton();
    fireEvent.click(screen.getByRole('button'));

    expect(open.mock.calls[0][0]).toContain('mode=popup');
    expect(screen.getByRole('button')).toHaveTextContent('Waiting for Google');

    await broadcast({ source: AUTH_CHANNEL, ok: true });

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
    expect(invalidate).toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveTextContent('Continue with Google');
    expect(signInWithGoogle).not.toHaveBeenCalled();
  });

  it('explains a failed sign-in and stays signed out', async () => {
    const { onSignedIn } = renderButton();
    fireEvent.click(screen.getByRole('button'));

    await broadcast({ source: AUTH_CHANNEL, ok: false, error: 'failed' });

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Could not sign you in',
          variant: 'destructive',
        })
      )
    );
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('falls back to a full-page redirect when the popup is blocked', () => {
    open.mockReturnValue(null);
    renderButton();
    fireEvent.click(screen.getByRole('button'));
    expect(signInWithGoogle).toHaveBeenCalledWith('/writing');
  });
});
