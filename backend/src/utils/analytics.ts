import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { getCountryForTimezone } from 'countries-and-timezones';
import { getAllowedOrigins } from '../config/origins.js';

const BOT_PATTERN =
  /bot|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|quora link|whatsapp|telegrambot|discordbot|slackbot|vkshare|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|postman|insomnia|monitor|uptime|pingdom|datadog/i;

export function isBot(userAgent: string | undefined): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function parseUserAgent(userAgent: string | undefined) {
  const { browser, os, device } = new UAParser(userAgent).getResult();
  const type = device.type;
  return {
    device: !type ? 'desktop' : type === 'mobile' || type === 'tablet' ? type : 'other',
    browser: browser.name ?? null,
    os: os.name ?? null,
  };
}

const siteHosts = new Set(
  getAllowedOrigins()
    .map((origin) => {
      try {
        return new URL(origin).hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    })
    .filter((host): host is string => !!host)
);

/** External referring host, or null for direct visits and navigation inside the site. */
export function referrerHost(referrer: string | undefined | null): string | null {
  if (!referrer) return null;
  try {
    const { hostname, protocol } = new URL(referrer);
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    const host = hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === 'localhost' || host === '127.0.0.1' || siteHosts.has(host)) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/** Referrer hosts and utm_source values grouped under one readable name. */
const SOURCES: [RegExp, string][] = [
  [
    /^(newsletter|email|e-mail|mail)$|^(mail\.google|outlook\.live|mail\.yahoo)\./,
    'Newsletter & email',
  ],
  [/(^|\.)google\.|^google$/, 'Google'],
  [/(^|\.)bing\.com$|^bing$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$|^duckduckgo$/, 'DuckDuckGo'],
  [/(^|\.)yahoo\.|^yahoo$/, 'Yahoo'],
  [/(^|\.)yandex\./, 'Yandex'],
  [/(^|\.)baidu\.com$/, 'Baidu'],
  [/(^|\.)ecosia\.org$/, 'Ecosia'],
  [/^search\.brave\.com$/, 'Brave Search'],
  [/^(t\.co|twitter\.com|x\.com|mobile\.twitter\.com)$|^(twitter|x)$/, 'X (Twitter)'],
  [/(^|\.)facebook\.com$|^fb\.me$|^facebook$|^fb$/, 'Facebook'],
  [/(^|\.)instagram\.com$|^instagram$/, 'Instagram'],
  [/(^|\.)linkedin\.com$|^lnkd\.in$|^linkedin$/, 'LinkedIn'],
  [/(^|\.)reddit\.com$|^reddit$/, 'Reddit'],
  [/^news\.ycombinator\.com$|^hn$|^hackernews$/, 'Hacker News'],
  [/(^|\.)github\.com$|^github$/, 'GitHub'],
  [/(^|\.)youtube\.com$|^youtu\.be$|^youtube$/, 'YouTube'],
  [/^t\.me$|(^|\.)telegram\.(org|me)$|^telegram$/, 'Telegram'],
  [/(^|\.)discord(app)?\.com$|^discord$/, 'Discord'],
  [/(^|\.)medium\.com$/, 'Medium'],
  [/^dev\.to$/, 'DEV'],
  [/(^|\.)substack\.com$/, 'Substack'],
  [/^(chatgpt\.com|chat\.openai\.com)$|^chatgpt$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$|^perplexity$/, 'Perplexity'],
];

export function sourceName(referrer: string | null, utmSource: string | null): string {
  const raw = (utmSource || referrer || '').trim().toLowerCase();
  if (!raw) return 'Direct';
  const match = SOURCES.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : raw;
}

const HEADER_COUNTRY = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'x-country-code',
];

/**
 * Country from the CDN or proxy when it provides one, otherwise from the browser's timezone.
 * Nothing about the IP address is kept.
 */
export function detectCountry(req: Request, timezone?: string): string | null {
  for (const header of HEADER_COUNTRY) {
    const value = req.get(header)?.toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'T1') return value;
  }
  if (timezone && timezone.length <= 64) {
    return getCountryForTimezone(timezone)?.id ?? null;
  }
  return null;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Keeps the pathname plus the topic filter, which is the only query parameter that changes what a
 * page shows. Everything else (utm tags, tracking ids) would split one page into many rows.
 */
export function normalizePath(input: string): string | null {
  try {
    const url = new URL(input, 'http://site.invalid');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path.length > 300) return null;
    const tag = url.searchParams.get('tag');
    return tag ? `${path}?tag=${encodeURIComponent(tag.slice(0, 60))}` : path;
  } catch {
    return null;
  }
}

/** Dashboard, editor, API and framework routes are never counted. */
export function isTrackablePath(path: string): boolean {
  return (
    !/^\/(admin|api|_next)(\/|$|\?)/.test(path) && !/^\/articles\/(new|[^/?]+\/edit)$/.test(path)
  );
}

const ARTICLE_PATH = /^\/articles\/([^/?]+)$/;
const NOT_ARTICLES = new Set(['new', 'mine', 'topics']);

export function articleSlugFromPath(path: string): string | null {
  const slug = path.match(ARTICLE_PATH)?.[1];
  return slug && !NOT_ARTICLES.has(slug) ? decodeURIComponent(slug) : null;
}
