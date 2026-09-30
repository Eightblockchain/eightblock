import { fetcher } from './api';

export interface SupportWalletInput {
  id?: string;
  network: string;
  currency: string;
  address: string;
  label: string | null;
  note: string | null;
  enabled: boolean;
}

export interface SupportWallet extends SupportWalletInput {
  id: string;
  position: number;
  updatedAt: string;
}

export const MAX_WALLETS = 10;

/** Every wallet, including disabled ones. */
export function fetchSupportWallets(): Promise<SupportWallet[]> {
  return fetcher('/support-wallets/manage', { cache: 'no-store' });
}

/** Replaces the whole list; the array order becomes the display order on the blog. */
export function saveSupportWallets(wallets: SupportWalletInput[]): Promise<SupportWallet[]> {
  return fetcher('/support-wallets', { method: 'PUT', body: JSON.stringify({ wallets }) });
}
