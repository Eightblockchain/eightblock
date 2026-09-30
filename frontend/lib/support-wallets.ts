const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface SupportWallet {
  id: string;
  network: string;
  currency: string;
  address: string;
  label: string | null;
  note: string | null;
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
