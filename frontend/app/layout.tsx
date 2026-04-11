import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { WalletProvider } from '@/lib/wallet-context';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { Toaster } from '@/components/ui/toaster';
import { siteConfig } from '@/lib/site-config';
import './globals.css';
import '../styles/mdx.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: {
    template: '%s | eightblock',
    default: `${siteConfig.name} - Cardano Community Hub`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: [
    'Cardano',
    'Blockchain',
    'Crypto',
    'Web3',
    'Community',
    'Intersect',
    'Governance',
    'Development',
    'Education',
  ],
  authors: [{ name: 'Eightblock Community' }],
  creator: 'Eightblock',
  publisher: 'Eightblock',
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: `${siteConfig.name} - Cardano Community Hub` }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@Eightblock66103',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: `${siteConfig.name} - Cardano Community Hub` }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <body className={`${lato.variable} font-sans min-h-screen bg-background text-foreground`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        <ReactQueryProvider>
          <WalletProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 bg-gradient-to-b from-white to-slate-50">{children}</main>
              <SiteFooter />
            </div>
            <Toaster />
          </WalletProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
