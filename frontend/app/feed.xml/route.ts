import DOMPurify from 'isomorphic-dompurify';
import { siteConfig } from '@/lib/site-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.eightblock.dev/api';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
const ITEMS = 20;

export const revalidate = 600;

interface FeedArticle {
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  categories?: { category: { name: string } }[];
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: { tag: { name: string } }[];
  author?: { name: string | null } | null;
}

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

function excerpt(article: FeedArticle) {
  if (article.description) return article.description;
  const text = (article.content ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 280 ? `${text.slice(0, text.lastIndexOf(' ', 280))}…` : text;
}

async function fetchLatest(): Promise<FeedArticle[]> {
  try {
    const res = await fetch(`${API_URL}/articles?page=1&limit=${ITEMS}&sort=latest`, {
      next: { revalidate },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.articles) ? data.articles : [];
  } catch {
    return [];
  }
}

function item(article: FeedArticle) {
  const url = `${BASE_URL}/articles/${article.slug}`;
  const published = new Date(article.publishedAt ?? article.createdAt).toUTCString();
  const categories = [
    ...(article.categories ?? []).map((c) => c.category.name),
    ...(article.tags ?? []).map((t) => t.tag.name),
  ].filter((name, index, all): name is string => !!name && all.indexOf(name) === index);
  const image = article.featuredImage?.startsWith('https://')
    ? `<p><img src="${escape(article.featuredImage)}" alt="" /></p>`
    : '';
  const body = DOMPurify.sanitize(article.content ?? '');

  return `    <item>
      <title>${escape(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${published}</pubDate>
      ${article.author?.name ? `<dc:creator>${escape(article.author.name)}</dc:creator>` : ''}
      ${categories.map((name) => `<category>${escape(name)}</category>`).join('\n      ')}
      <description>${escape(excerpt(article))}</description>
      <content:encoded>${cdata(image + body)}</content:encoded>
    </item>`;
}

export async function GET() {
  const articles = await fetchLatest();
  const newest = articles[0];
  const lastBuild = newest
    ? new Date(newest.updatedAt ?? newest.publishedAt ?? newest.createdAt)
    : new Date();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(siteConfig.name)}</title>
    <link>${BASE_URL}</link>
    <description>${escape(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${articles.map(item).join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
    },
  });
}
