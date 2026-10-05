/**
 * Email markup. Table layout and inline styles because Gmail, Outlook and Apple Mail
 * each drop different parts of modern CSS; the <style> block only adds dark mode and
 * small-screen tweaks for clients that support it.
 */

import type { EmailCopy } from './email-copy.js';

export interface EmailArticle {
  title: string;
  url: string;
  excerpt: string;
  category?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  readingMinutes?: number | null;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

const COLORS = {
  page: '#f2f4f7',
  card: '#ffffff',
  border: '#e4e7ec',
  line: '#eaecf0',
  ink: '#0f172a',
  body: '#344054',
  muted: '#667085',
  link: '#0a6fa3',
  blue: '#1b9dd9',
  gold: '#fcbd1b',
};

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CONTENT_STYLES: Record<string, string> = {
  p: `margin:0 0 18px;font-size:16px;line-height:1.7;color:${COLORS.body};`,
  h1: `margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${COLORS.ink};`,
  h2: `margin:32px 0 12px;font-size:21px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${COLORS.ink};`,
  h3: `margin:24px 0 8px;font-size:18px;line-height:1.35;font-weight:700;color:${COLORS.ink};`,
  h4: `margin:20px 0 8px;font-size:16px;line-height:1.4;font-weight:700;color:${COLORS.ink};`,
  a: `color:${COLORS.link};text-decoration:underline;`,
  ul: `margin:0 0 18px;padding:0 0 0 22px;color:${COLORS.body};`,
  ol: `margin:0 0 18px;padding:0 0 0 22px;color:${COLORS.body};`,
  li: `margin:0 0 8px;font-size:16px;line-height:1.7;color:${COLORS.body};`,
  blockquote: `margin:0 0 18px;padding:2px 0 2px 16px;border-left:3px solid ${COLORS.gold};color:${COLORS.body};`,
  img: 'display:block;max-width:100%;height:auto;border:0;margin:8px 0 18px;border-radius:6px;',
  hr: `border:0;border-top:1px solid ${COLORS.line};margin:28px 0;`,
  pre: `margin:0 0 18px;padding:14px 16px;background:#f6f8fa;border:1px solid ${COLORS.line};border-radius:6px;font-family:${MONO};font-size:13px;line-height:1.6;color:${COLORS.ink};white-space:pre-wrap;word-break:break-word;`,
  code: `font-family:${MONO};font-size:0.9em;color:${COLORS.ink};`,
  strong: `font-weight:700;color:${COLORS.ink};`,
  b: `font-weight:700;color:${COLORS.ink};`,
};

/** The editor wraps list text in <p>, which would double-space every item. */
const unwrapListParagraphs = (html: string) =>
  html.replace(/<li(\s[^>]*)?>\s*<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, '<li$1>$2');

/** Inlines typography onto editor HTML; styles already on an element win. */
export function styleContent(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return unwrapListParagraphs(withoutScripts).replace(
    /<(p|h[1-4]|a|ul|ol|li|blockquote|img|hr|pre|code|strong|b)(\s[^>]*?)?(\/?)>/gi,
    (_match, tag: string, attrs = '', selfClose: string) => {
      const base = CONTENT_STYLES[tag.toLowerCase()];
      const existing = /\sstyle\s*=\s*(["'])(.*?)\1/i.exec(attrs);
      const merged = existing
        ? attrs.replace(existing[0], ` style="${base}${existing[2]}"`)
        : `${attrs} style="${base}"`;
      return `<${tag}${merged}${selfClose}>`;
    }
  );
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

/** Readable plain-text alternative; spam filters score HTML-only mail lower. */
export function htmlToText(html: string): string {
  return unwrapListParagraphs(html)
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '')
    .replace(
      /<a\s[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
      (_m, _q, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, '').trim();
        return !text || text === href ? href : `${text} (${href})`;
      }
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/(p|h[1-6]|blockquote|pre|ul|ol|div|tr)>/gi, '\n\n')
    .replace(/<hr[^>]*>/gi, '\n---\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(
      /&(#?\w+);/g,
      (m, name: string) =>
        ENTITIES[name] ?? (name.startsWith('#') ? String.fromCodePoint(Number(name.slice(1))) : m)
    )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(value: string, max: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : clean;
}

function articleMeta(article: EmailArticle) {
  return [article.author, article.readingMinutes ? `${article.readingMinutes} min read` : null]
    .filter(Boolean)
    .join(' · ');
}

function featuredArticle(article: EmailArticle) {
  const meta = articleMeta(article);
  return `
  <tr><td style="padding:0 0 28px;">
    ${
      article.imageUrl
        ? `<a href="${escapeHtml(article.url)}" style="text-decoration:none;"><img src="${escapeHtml(article.imageUrl)}" width="520" alt="" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:6px;margin:0 0 16px;"></a>`
        : ''
    }
    ${
      article.category
        ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.link};" class="eb-link">${escapeHtml(article.category)}</p>`
        : ''
    }
    <a href="${escapeHtml(article.url)}" style="font-family:${SANS};font-size:21px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${COLORS.ink};text-decoration:none;" class="eb-ink">${escapeHtml(article.title)}</a>
    <p style="margin:8px 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.body};" class="eb-body">${escapeHtml(truncate(article.excerpt, 200))}</p>
    ${meta ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:13px;color:${COLORS.muted};" class="eb-muted">${escapeHtml(meta)}</p>` : ''}
    <p style="margin:14px 0 0;font-family:${SANS};font-size:14px;font-weight:600;"><a href="${escapeHtml(article.url)}" style="color:${COLORS.link};text-decoration:none;" class="eb-link">Read the article &rarr;</a></p>
  </td></tr>`;
}

function compactArticle(article: EmailArticle) {
  const meta = articleMeta(article);
  return `
  <tr><td style="padding:20px 0;border-top:1px solid ${COLORS.line};" class="eb-line">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" style="font-family:${SANS};">
        ${
          article.category
            ? `<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.link};" class="eb-link">${escapeHtml(article.category)}</p>`
            : ''
        }
        <a href="${escapeHtml(article.url)}" style="font-size:17px;line-height:1.35;font-weight:700;color:${COLORS.ink};text-decoration:none;" class="eb-ink">${escapeHtml(article.title)}</a>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${COLORS.body};" class="eb-body">${escapeHtml(truncate(article.excerpt, 130))}</p>
        ${meta ? `<p style="margin:8px 0 0;font-size:12px;color:${COLORS.muted};" class="eb-muted">${escapeHtml(meta)}</p>` : ''}
      </td>
      ${
        article.imageUrl
          ? `<td width="112" valign="top" style="padding-left:16px;" class="eb-thumb"><a href="${escapeHtml(article.url)}"><img src="${escapeHtml(article.imageUrl)}" width="96" height="96" alt="" style="display:block;width:96px;height:96px;object-fit:cover;border:0;border-radius:6px;"></a></td>`
          : ''
      }
    </tr></table>
  </td></tr>`;
}

function articlesSection(articles: EmailArticle[], label: string) {
  if (articles.length === 0) return '';
  const [first, ...rest] = articles;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 0;">
    <tr><td style="padding:24px 0 20px;border-top:1px solid ${COLORS.line};" class="eb-line">
      <p style="margin:0;font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.muted};" class="eb-muted">${escapeHtml(label)}</p>
    </td></tr>
    ${featuredArticle(first)}
    ${rest.map(compactArticle).join('')}
  </table>`;
}

function button(label: string, href: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;"><tr>
    <td bgcolor="${COLORS.ink}" style="border-radius:999px;" class="eb-btn">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-family:${SANS};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
    </td>
  </tr></table>`;
}

/** Display size of assets/email/logo.png, which is rendered at 3x for sharp screens. */
const LOGO = { width: 169, height: 60 };

interface LayoutOptions {
  siteUrl: string;
  logoSrc: string;
  title: string;
  preheader?: string | null;
  label: string;
  body: string;
  reason: string;
  unsubscribeUrl?: string;
  postalAddress?: string | null;
}

function layout(options: LayoutOptions) {
  const site = options.siteUrl.replace(/\/$/, '');
  const siteHost = site.replace(/^https?:\/\//, '');
  const preheader = options.preheader?.trim();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(options.title)}</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  a { color:${COLORS.link}; }
  @media (max-width:620px) {
    .eb-pad { padding:28px 22px !important; }
    .eb-header { padding:0 6px 16px !important; }
    .eb-thumb { display:none !important; }
    .eb-body h1 { font-size:24px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .eb-page { background:#0b0f17 !important; }
    .eb-card { background:#111827 !important; border-color:#1f2937 !important; }
    .eb-ink, .eb-body h1, .eb-body h2, .eb-body h3, .eb-body h4, .eb-body strong, .eb-body b, .eb-body code, .eb-body pre { color:#f3f4f6 !important; }
    .eb-body, .eb-body p, .eb-body li, .eb-body blockquote { color:#d0d5dd !important; }
    .eb-body pre { background:#0b0f17 !important; border-color:#1f2937 !important; }
    .eb-muted { color:#98a2b3 !important; }
    .eb-link, .eb-body a { color:#5cc3f0 !important; }
    .eb-line { border-color:#1f2937 !important; }
    .eb-btn { background:#f3f4f6 !important; }
    .eb-btn a { color:#0b0f17 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};" class="eb-page">
${
  preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>`
    : ''
}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page};" class="eb-page">
  <tr><td align="center" style="padding:32px 12px 40px;">
    <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <tr><td class="eb-header" style="padding:0 4px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle">
            <a href="${escapeHtml(site)}" style="text-decoration:none;">
              <img src="${escapeHtml(options.logoSrc)}" width="${LOGO.width}" height="${LOGO.height}" alt="Eightblock" style="display:block;width:${LOGO.width}px;height:${LOGO.height}px;border:0;outline:none;text-decoration:none;font-family:${SANS};font-size:16px;font-weight:700;line-height:${LOGO.height}px;color:${COLORS.blue};">
            </a>
          </td>
          <td align="right" valign="middle" style="padding-bottom:12px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};" class="eb-muted">${escapeHtml(options.label)}</td>
        </tr></table>
      </td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td height="3" width="78%" bgcolor="${COLORS.blue}" style="font-size:0;line-height:0;">&nbsp;</td>
          <td height="3" width="22%" bgcolor="${COLORS.gold}" style="font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>
      <tr><td class="eb-card eb-pad eb-body" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-top:0;padding:40px 44px;font-family:${SANS};color:${COLORS.body};">
        ${options.body}
      </td></tr>
      <tr><td align="center" style="padding:28px 24px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${COLORS.muted};" class="eb-muted">
        <p style="margin:0 0 8px;">${escapeHtml(options.reason)}</p>
        <p style="margin:0 0 8px;">
          ${options.unsubscribeUrl ? `<a href="${escapeHtml(options.unsubscribeUrl)}" style="color:${COLORS.muted};text-decoration:underline;" class="eb-muted">Unsubscribe</a> &nbsp;&middot;&nbsp; ` : ''}<a href="${escapeHtml(site)}" style="color:${COLORS.muted};text-decoration:underline;" class="eb-muted">${escapeHtml(siteHost)}</a>
        </p>
        ${options.postalAddress ? `<p style="margin:0 0 8px;">${escapeHtml(options.postalAddress)}</p>` : ''}
        <p style="margin:0;">&copy; ${year} Eightblock</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body>
</html>`;
}

function textFooter(
  reason: string,
  siteUrl: string,
  unsubscribeUrl?: string,
  postalAddress?: string | null
) {
  return [
    '---',
    reason,
    unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : null,
    siteUrl,
    postalAddress || null,
  ]
    .filter(Boolean)
    .join('\n');
}

function articlesText(articles: EmailArticle[], label: string) {
  if (articles.length === 0) return '';
  const items = articles.map((a) => {
    const meta = articleMeta(a);
    return [a.title, truncate(a.excerpt, 200), meta, a.url].filter(Boolean).join('\n');
  });
  return `\n\n${label.toUpperCase()}\n\n${items.join('\n\n')}`;
}

const issueDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export interface NewsletterOptions {
  subject: string;
  preheader?: string | null;
  html: string;
  articles: EmailArticle[];
  siteUrl: string;
  logoSrc: string;
  unsubscribeUrl?: string;
  postalAddress?: string | null;
  date?: Date;
}

export function renderNewsletter(options: NewsletterOptions): RenderedEmail {
  const reason = 'You are receiving this because you subscribed to the Eightblock newsletter.';
  const content = options.html.trim() ? styleContent(options.html) : '';
  const body = `${content}${articlesSection(options.articles, content ? 'In this issue' : 'New on Eightblock')}`;

  return {
    html: layout({
      siteUrl: options.siteUrl,
      logoSrc: options.logoSrc,
      title: options.subject,
      preheader: options.preheader,
      label: issueDate(options.date ?? new Date()),
      body,
      reason,
      unsubscribeUrl: options.unsubscribeUrl,
      postalAddress: options.postalAddress,
    }),
    text: `${htmlToText(options.html)}${articlesText(options.articles, 'In this issue')}\n\n${textFooter(reason, options.siteUrl, options.unsubscribeUrl, options.postalAddress)}`.trim(),
  };
}

const eyebrow = (text: string) =>
  `<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.muted};" class="eb-muted">${escapeHtml(text)}</p>`;

/** Joins text blocks with blank lines, collapsing the gaps left by empty sections. */
const textBody = (lines: (string | null | undefined)[]) =>
  lines
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export interface MessageOptions {
  /** Filled-in wording; see email-copy.ts. */
  copy: EmailCopy;
  siteUrl: string;
  logoSrc: string;
  /** Top-right of the header, such as "Newsletter". */
  label: string;
  /** Footer line saying why this address got the email. */
  reason: string;
  /** Where the button goes; `showLink` also prints the address for clients that block buttons. */
  button: { href: string; showLink?: boolean };
  articles?: EmailArticle[];
  unsubscribeUrl?: string;
  postalAddress?: string | null;
}

const hasText = (html: string) => html.replace(/<[^>]+>/g, '').trim().length > 0;

/** The one-off emails (confirmations and welcomes): admin wording inside the fixed layout. */
export function renderMessage(options: MessageOptions): RenderedEmail {
  const site = options.siteUrl.replace(/\/$/, '');
  const { copy, button: action } = options;
  const articles = options.articles ?? [];
  const note = hasText(copy.note) ? copy.note : '';

  const body = `
    ${copy.eyebrow ? eyebrow(copy.eyebrow) : ''}
    ${copy.heading ? `<h1 style="${CONTENT_STYLES.h1}">${escapeHtml(copy.heading)}</h1>` : ''}
    ${hasText(copy.body) ? styleContent(copy.body) : ''}
    ${copy.buttonLabel ? button(copy.buttonLabel, action.href) : ''}
    ${
      action.showLink
        ? `<p style="margin:20px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${COLORS.muted};word-break:break-all;" class="eb-muted">
      Or paste this link into your browser:<br>
      <a href="${escapeHtml(action.href)}" style="color:${COLORS.link};text-decoration:none;" class="eb-link">${escapeHtml(action.href)}</a>
    </p>`
        : ''
    }
    ${note ? `<div class="eb-line" style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLORS.line};">${styleContent(note)}</div>` : ''}
    ${articlesSection(articles, copy.articlesLabel)}
  `;

  return {
    html: layout({
      siteUrl: site,
      logoSrc: options.logoSrc,
      title: copy.subject || copy.heading,
      preheader: copy.preheader,
      label: options.label,
      body,
      reason: options.reason,
      unsubscribeUrl: options.unsubscribeUrl,
      postalAddress: options.postalAddress,
    }),
    text: textBody([
      copy.heading,
      '',
      htmlToText(copy.body),
      '',
      copy.buttonLabel ? `${copy.buttonLabel}: ${action.href}` : null,
      '',
      note ? htmlToText(note) : null,
      articlesText(articles, copy.articlesLabel),
      '',
      textFooter(options.reason, site, options.unsubscribeUrl, options.postalAddress),
    ]),
  };
}
