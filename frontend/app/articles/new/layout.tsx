import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Write an article',
  robots: { index: false },
};

export default function NewArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
