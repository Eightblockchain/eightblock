import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { PageTracker } from '@/components/analytics/page-tracker';
import { SiteShell } from '@/components/layout/site-shell';
import { ThemeProvider } from '@eightblock/ui/theme-provider';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { Toaster } from '@eightblock/ui/components/toaster';
import { siteConfig } from '@/lib/site-config';
import { jsonLd } from '@/lib/json-ld';
import { OG_SIZE, feedAlternates, ogImagePath } from '@/lib/page-metadata';
import '@eightblock/ui/styles/globals.css';
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: feedAlternates,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: ogImagePath(), ...OG_SIZE, alt: siteConfig.name }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [ogImagePath()],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/apple-icon`,
    sameAs: Object.values(siteConfig.links),
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: 'en',
        publisher: { '@id': organization['@id'] },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(siteLd)} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ReactQueryProvider>
            <SiteShell>{children}</SiteShell>
            <Toaster />
            <Suspense fallback={null}>
              <PageTracker />
            </Suspense>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
