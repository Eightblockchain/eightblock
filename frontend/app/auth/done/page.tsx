import type { Metadata } from 'next';
import { PopupDone } from './popup-done';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false },
};

export default async function AuthDonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { error } = await searchParams;
  return <PopupDone error={(Array.isArray(error) ? error[0] : error) ?? null} />;
}
