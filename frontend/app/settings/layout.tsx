import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile settings',
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
