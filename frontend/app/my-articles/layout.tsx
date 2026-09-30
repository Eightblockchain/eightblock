import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your articles',
  robots: { index: false },
};

export default function MyArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
