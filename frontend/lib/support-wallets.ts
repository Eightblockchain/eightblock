const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface SupportWallet {
  id: string;
  network: string;
  currency: string;
  address: string;
  label: string | null;
  note: string | null;
}

/** Browser fetch of the current list. Throws on failure, so the caller keeps what it has. */
export async function loadSupportWallets(): Promise<SupportWallet[]> {
  const res = await fetch(`${API_URL}/support-wallets`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load support wallets (${res.status})`);
  return (await res.json()) as SupportWallet[];
}

/** Enabled wallets in display order. Empty on failure, which hides the support box. */
export async function fetchSupportWallets(): Promise<SupportWallet[]> {
  try {
    const res = await fetch(`${API_URL}/support-wallets`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    return (await res.json()) as SupportWallet[];
  } catch {
    return [];
  }
}
