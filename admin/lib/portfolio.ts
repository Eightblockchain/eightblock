import { ApiError } from './api';

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

/** The blog's About page fills blank fields with its default text. */
export const emptyPortfolio: PortfolioInput = {
  headline: null,
  intro: null,
  story: null,
  location: null,
  focusAreas: [],
  projects: [],
  links: {},
};

/** Null means no portfolio was saved yet. A failed load throws, so the editor never starts blank. */
export async function fetchPortfolio(init?: RequestInit): Promise<Portfolio | null> {
  const res = await fetch(`${API_URL}/portfolio`, init);
  if (!res.ok) throw new ApiError('Could not load the portfolio', res.status);
  return (await res.json()) as Portfolio | null;
}
