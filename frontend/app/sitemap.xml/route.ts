import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';

interface Article {
  slug: string;
  status: string;
  updatedAt: string;
  publishedAt: string;
}

async function fetchAllPublishedArticles(): Promise<Article[]> {
  const articles: Article[] = [];
  let page = 1;
  const limit = 100;
  // Google enforces a 50,000 URL / 50 MB per-sitemap limit.
  // Fetch at most 49,994 articles (leaving room for static pages).
  const MAX_ARTICLE_URLS = 49_994;

  try {
    while (articles.length < MAX_ARTICLE_URLS) {
      const res = await fetch(`${API_URL}/articles?page=${page}&limit=${limit}&status=PUBLISHED`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();

      const pageArticles: Article[] = Array.isArray(data)
        ? data
        : Array.isArray(data.articles)
          ? data.articles
          : [];

      if (pageArticles.length === 0) break;
      articles.push(...pageArticles.filter((a) => a.status === 'PUBLISHED'));

      const pagination = data.pagination;
      if (!pagination || page >= pagination.totalPages) break;
      page++;
    }
  } catch (e) {
    console.error('Failed to fetch articles for sitemap:', e);
  }

  return articles.slice(0, MAX_ARTICLE_URLS);
}

export async function GET() {
  const articles = await fetchAllPublishedArticles();

  const now = new Date().toISOString();

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'articles', priority: '0.9', changefreq: 'daily' },
    { path: 'contributors', priority: '0.6', changefreq: 'weekly' },
    { path: 'github', priority: '0.5', changefreq: 'weekly' },
    { path: 'privacy', priority: '0.3', changefreq: 'monthly' },
    { path: 'terms', priority: '0.3', changefreq: 'monthly' },
  ];

  const staticEntries = staticPages
    .map(
      ({ path, priority, changefreq }) =>
        `<url>
  <loc>${BASE_URL}${path ? `/${path}` : ''}</loc>
  <lastmod>${now}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`
    )
    .join('\n');

  const articleEntries = articles
    .map((a) => {
      const lastmod = a.updatedAt || a.publishedAt || now;
      return `<url>
  <loc>${BASE_URL}/articles/${a.slug}</loc>
  <lastmod>${new Date(lastmod).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${articleEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
