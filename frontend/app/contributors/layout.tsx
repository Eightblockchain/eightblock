import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contributors',
  description:
    'Meet the developers, designers, and blockchain enthusiasts who build and maintain the Eightblock platform.',
  openGraph: {
    title: 'Contributors | Eightblock',
    description:
      'Meet the developers, designers, and blockchain enthusiasts who build and maintain the Eightblock platform.',
    type: 'website',
  },
};

export default function ContributorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
