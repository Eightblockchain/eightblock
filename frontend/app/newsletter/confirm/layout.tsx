import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirm your subscription',
  robots: { index: false },
};

export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
