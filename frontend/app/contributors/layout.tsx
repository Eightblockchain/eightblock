import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contributors',
  description:
    'Meet the developers, designers, and blockchain enthusiasts who build and maintain the Eightblock platform.',
  alternates: { canonical: '/contributors' },
  openGraph: {
    title: 'Contributors | Eightblock',
    description:
      'Meet the developers, designers, and blockchain enthusiasts who build and maintain the Eightblock platform.',
    type: 'website',
    url: '/contributors',
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
};

export default function ContributorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
