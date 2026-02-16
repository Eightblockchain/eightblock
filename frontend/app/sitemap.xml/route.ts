import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

async function fetchAllArticles() {
  try {
    const res = await fetch(`${API_URL}/articles`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error('Failed to fetch articles for sitemap:', e);
    return [];
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eightblock.dev';

  const articles = await fetchAllArticles();

  const staticUrls = ['', 'articles', 'contributors', 'github', 'privacy', 'terms'];

  const urls = staticUrls
    .map((p) => `${baseUrl}/${p}`.replace(/\/$/, ''))
    .concat(
      Array.isArray(articles)
        ? articles
            .filter((a: any) => a.status === 'PUBLISHED')
            .map((a: any) => `${baseUrl}/articles/${a.slug}`)
        : []
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    return `<url><loc>${url}</loc></url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
