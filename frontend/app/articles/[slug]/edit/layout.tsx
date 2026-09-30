import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit article',
  robots: { index: false },
};

export default function EditArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
