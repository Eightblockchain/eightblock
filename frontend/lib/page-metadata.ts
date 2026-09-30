import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const OG_SIZE = { width: 1200, height: 630 };

export interface OgCardContent {
  title: string;
  description?: string;
  eyebrow?: string;
  topics?: string[];
}

export const clamp = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, text.lastIndexOf(' ', max - 1) || max - 1)}…` : text;

/** Relative URL of a generated share card (metadataBase makes it absolute). No content = the site card. */
export function ogImagePath(content?: OgCardContent) {
  if (!content) return '/api/og';
  const params = new URLSearchParams({ title: content.title });
  if (content.description) params.set('description', clamp(content.description, 170));
  if (content.eyebrow) params.set('eyebrow', content.eyebrow);
  if (content.topics?.length) params.set('topics', content.topics.slice(0, 5).join(','));
  return `/api/og?${params.toString()}`;
}

/** Title, description, canonical URL and share card for a public page. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Defaults to a card generated from the title and description. */
  image?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const shareTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;
  const imageUrl = image ?? ogImagePath({ title, description });

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: 'en_US',
      type: 'website',
      images: [{ url: imageUrl, ...OG_SIZE, alt: shareTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: shareTitle,
      description,
      images: [imageUrl],
    },
  };
}
