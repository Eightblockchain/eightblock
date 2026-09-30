import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata: Metadata = pageMetadata({
  title: 'GitHub Repository',
  description:
    'Eightblock is fully open-source. Explore the code, report issues, submit pull requests, or fork the project to create your own version.',
  path: '/github',
});

export default function GithubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
