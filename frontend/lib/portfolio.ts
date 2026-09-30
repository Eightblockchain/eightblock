import { siteConfig } from '@/lib/site-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface PortfolioProject {
  name: string;
  description: string;
  url?: string;
}

export interface PortfolioLinks {
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
}

export interface Portfolio {
  name: string | null;
  avatarUrl: string | null;
  headline: string | null;
  intro: string | null;
  story: string | null;
  location: string | null;
  focusAreas: string[];
  projects: PortfolioProject[];
  links: PortfolioLinks;
  updatedAt?: string;
}

export type PortfolioInput = Omit<Portfolio, 'name' | 'avatarUrl' | 'updatedAt'>;

/** Content shown on the About page until the author saves a portfolio. */
export const defaultPortfolio: Portfolio = {
  name: siteConfig.author,
  avatarUrl: null,
  headline: siteConfig.role,
  intro: siteConfig.about.bio,
  story: siteConfig.about.extended,
  location: null,
  focusAreas: siteConfig.about.focusAreas,
  projects: [],
  links: { github: siteConfig.links.github, twitter: siteConfig.links.twitter },
};

export async function fetchPortfolio(init?: RequestInit): Promise<Portfolio | null> {
  try {
    const res = await fetch(`${API_URL}/portfolio`, init);
    if (!res.ok) return null;
    return (await res.json()) as Portfolio | null;
  } catch {
    return null;
  }
}

/** Saved portfolio merged over the defaults, so empty fields never leave holes on the page. */
export async function getPortfolio(): Promise<Portfolio> {
  const saved = await fetchPortfolio({ cache: 'no-store' });
  if (!saved) return defaultPortfolio;
  return {
    ...saved,
    name: saved.name || defaultPortfolio.name,
    headline: saved.headline || defaultPortfolio.headline,
    intro: saved.intro || defaultPortfolio.intro,
    story: saved.story || defaultPortfolio.story,
    focusAreas: saved.focusAreas.length ? saved.focusAreas : defaultPortfolio.focusAreas,
    links: Object.values(saved.links).some(Boolean) ? saved.links : defaultPortfolio.links,
  };
}

export function paragraphs(text: string | null | undefined) {
  return (text || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}
