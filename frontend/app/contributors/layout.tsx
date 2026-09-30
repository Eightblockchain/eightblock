import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Contributors',
  description:
    'Meet the developers, designers, and blockchain enthusiasts who build and maintain the Eightblock platform.',
  path: '/contributors',
});

export default function ContributorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
