const trim = (url: string) => url.replace(/\/$/, '');

export const siteConfig = {
  name: 'Eightblock',
  /** The public blog. Links to articles, the About page and the editor open there. */
  siteUrl: trim(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  adminUrl: trim(process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'),
};

/** Absolute URL of a page on the public blog. */
export const siteHref = (path = '/') => `${siteConfig.siteUrl}${path}`;
