import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupportCreator } from '@/components/support/support-creator';
import type { SupportWallet } from '@/lib/support-wallets';

const ada: SupportWallet = {
  id: 'ada',
  network: 'Cardano',
  currency: 'ADA',
  address: 'addr1qtestaddress0000000000',
  label: null,
  note: null,
};
const night: SupportWallet = { ...ada, id: 'night', network: 'Midnight', currency: 'NIGHT' };

function mockApi(response: Promise<Response>) {
  const fetchMock = vi.fn(() => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));

function renderBox(wallets: SupportWallet[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <SupportCreator wallets={wallets} />
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SupportCreator', () => {
  it('shows a wallet added after the page was cached, without a reload', async () => {
    const fetchMock = mockApi(json([ada, night]));
    renderBox([ada]);

    expect(screen.getByText('Support with ADA')).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /Midnight/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/support-wallets$/), {
      cache: 'no-store',
    });
  });

  it('keeps the server list when the API cannot be reached', async () => {
    const fetchMock = mockApi(Promise.resolve(new Response('', { status: 503 })));
    renderBox([ada]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Support with ADA')).toBeInTheDocument();
  });

  it('disappears when every wallet was removed', async () => {
    mockApi(json([]));
    renderBox([ada]);

    await waitFor(() => expect(screen.queryByText('Support this work')).not.toBeInTheDocument());
  });
});
