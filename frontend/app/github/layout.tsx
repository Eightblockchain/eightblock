import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'GitHub Repository',
  description:
    'Eightblock is fully open-source. Explore the code, report issues, submit pull requests, or fork the project to create your own version.',
  alternates: { canonical: '/github' },
  openGraph: {
    title: 'GitHub Repository | Eightblock',
    description:
      'Eightblock is fully open-source. Explore the code, report issues, submit pull requests, or fork the project to create your own version.',
    type: 'website',
    url: '/github',
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
};

export default function GithubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
