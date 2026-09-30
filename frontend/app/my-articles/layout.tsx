import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My articles',
  robots: { index: false },
};

export default function MyArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
