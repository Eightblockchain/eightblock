import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
