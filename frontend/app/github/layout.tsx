import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GitHub Repository',
  description:
    'Eightblock is fully open-source. Explore the code, report issues, submit pull requests, or fork the project to create your own version.',
  openGraph: {
    title: 'GitHub Repository | Eightblock',
    description:
      'Eightblock is fully open-source. Explore the code, report issues, submit pull requests, or fork the project to create your own version.',
    type: 'website',
  },
};

export default function GithubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
