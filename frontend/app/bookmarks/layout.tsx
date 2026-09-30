import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved articles',
  robots: { index: false },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
