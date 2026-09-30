/**
 * Email markup. Table layout and inline styles because Gmail, Outlook and Apple Mail
 * each drop different parts of modern CSS; the <style> block only adds dark mode and
 * small-screen tweaks for clients that support it.
 */

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

export interface ConfirmSubscriptionOptions {
  email: string;
  confirmUrl: string;
  siteUrl: string;
  logoSrc: string;
  expiresInDays: number;
  postalAddress?: string | null;
}

/**
 * Double opt-in: nothing else is sent to the address until this link is clicked. It is not
 * newsletter mail yet, so it has no unsubscribe link; ignoring it is the way to say no.
 */
export function renderConfirmSubscription(options: ConfirmSubscriptionOptions): RenderedEmail {
  const site = options.siteUrl.replace(/\/$/, '');
  const title = 'Confirm your subscription';
  const reason =
    'You are receiving this because someone entered this address on the Eightblock newsletter form.';
  const intro = `Please confirm that you want the Eightblock newsletter at ${options.email}. Until you do, we won't send anything else to this address.`;
  const ignore = `Didn't ask for this? Ignore this email and you won't be subscribed. The link expires in ${options.expiresInDays} days.`;

  const body = `
    ${eyebrow('One more step')}
    <h1 style="${CONTENT_STYLES.h1}">${escapeHtml(title)}</h1>
    <p style="${CONTENT_STYLES.p}">${escapeHtml(intro)}</p>
    ${button('Confirm subscription', options.confirmUrl)}
    <p style="margin:20px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${COLORS.muted};word-break:break-all;" class="eb-muted">
      Or paste this link into your browser:<br>
      <a href="${escapeHtml(options.confirmUrl)}" style="color:${COLORS.link};text-decoration:none;" class="eb-link">${escapeHtml(options.confirmUrl)}</a>
    </p>
    <p class="eb-line" style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLORS.line};font-family:${SANS};font-size:14px;line-height:1.7;color:${COLORS.body};">${escapeHtml(ignore)}</p>
  `;

  return {
    html: layout({
      siteUrl: site,
      logoSrc: options.logoSrc,
      title,
      preheader: 'Click the button to start receiving new articles.',
      label: 'Newsletter',
      body,
      reason,
      postalAddress: options.postalAddress,
    }),
    text: textBody([
      title,
      '',
      intro,
      '',
      `Confirm subscription: ${options.confirmUrl}`,
      '',
      ignore,
      '',
      textFooter(reason, site, undefined, options.postalAddress),
    ]),
  };
}

export interface WelcomeOptions {
  articles: EmailArticle[];
  siteUrl: string;
  logoSrc: string;
  /** The address had unsubscribed before and just signed up again. */
  returning?: boolean;
  unsubscribeUrl?: string;
  postalAddress?: string | null;
}

/** Sent after a newsletter signup. */
export function renderWelcome(options: WelcomeOptions): RenderedEmail {
  const site = options.siteUrl.replace(/\/$/, '');
  const reason =
    'You are receiving this because this address was subscribed to the Eightblock newsletter.';
  const copy = options.returning
    ? {
        eyebrow: 'Subscription renewed',
        title: 'Welcome back',
        preheader: 'You are subscribed again. Here is what you missed.',
        paragraphs: [
          "You're subscribed to the Eightblock newsletter again. New articles on Cardano, smart contracts and decentralized systems will reach this inbox again.",
          'Changed your mind? The unsubscribe link at the bottom of every email works in one click.',
        ],
        articlesLabel: 'Catch up on these',
      }
    : {
        eyebrow: 'Subscription confirmed',
        title: "You're on the list",
        preheader: 'Your subscription is confirmed. Here is where to start.',
        paragraphs: [
          "Thanks for subscribing to Eightblock. You'll get new articles on Cardano, smart contracts and decentralized systems, written by people who build them, delivered straight to your inbox.",
          'No noise and no spam. Every email has a one-click unsubscribe link at the bottom.',
        ],
        articlesLabel: 'Start with these',
      };

  const intro = `
    ${eyebrow(copy.eyebrow)}
    <h1 style="${CONTENT_STYLES.h1}">${escapeHtml(copy.title)}</h1>
    ${copy.paragraphs.map((p) => `<p style="${CONTENT_STYLES.p}">${escapeHtml(p)}</p>`).join('')}
    ${button('Browse the articles', `${site}/writing`)}
  `;

  return {
    html: layout({
      siteUrl: site,
      logoSrc: options.logoSrc,
      title: copy.title,
      preheader: copy.preheader,
      label: 'Newsletter',
      body: `${intro}${articlesSection(options.articles, copy.articlesLabel)}`,
      reason,
      unsubscribeUrl: options.unsubscribeUrl,
      postalAddress: options.postalAddress,
    }),
    text: textBody([
      copy.title,
      '',
      ...copy.paragraphs.flatMap((p) => [p, '']),
      `Browse the articles: ${site}/writing`,
      articlesText(options.articles, copy.articlesLabel),
      '',
      textFooter(reason, site, options.unsubscribeUrl, options.postalAddress),
    ]),
  };
}

export interface AccountWelcomeOptions {
  name: string | null;
  email: string;
  /** Whether the address already receives the newsletter. */
  subscribed: boolean;
  siteUrl: string;
  logoSrc: string;
  postalAddress?: string | null;
}

const ACCOUNT_FEATURES = [
  ['Bookmarks', 'Save articles and pick up where you left off on any device.'],
  ['Claps and comments', 'Show what helped you and join the discussion under each article.'],
  ['Your profile', 'Add a name, photo and short bio so other readers know who you are.'],
] as const;

/** Sent once, when someone creates an account. Transactional, so it has no unsubscribe link. */
export function renderAccountWelcome(options: AccountWelcomeOptions): RenderedEmail {
  const site = options.siteUrl.replace(/\/$/, '');
  const firstName = options.name?.trim().split(/\s+/)[0];
  const title = firstName ? `Welcome to Eightblock, ${firstName}` : 'Welcome to Eightblock';
  const reason =
    'You are receiving this because an Eightblock account was created with this address.';
  const intro = `Your account is ready. You can sign in any time with Google using ${options.email}.`;
  const newsletter = options.subscribed
    ? 'This address is also subscribed to the newsletter, so new articles will keep arriving here.'
    : 'Creating an account does not subscribe you to the newsletter. If you would like new articles by email, you can subscribe in one click.';

  const features = ACCOUNT_FEATURES.map(
    ([name, detail]) => `
    <tr><td class="eb-line" style="padding:14px 0;border-top:1px solid ${COLORS.line};">
      <p style="margin:0 0 2px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.5;color:${COLORS.ink};" class="eb-ink">${escapeHtml(name)}</p>
      <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${COLORS.body};">${escapeHtml(detail)}</p>
    </td></tr>`
  ).join('');

  const body = `
    ${eyebrow('Account created')}
    <h1 style="${CONTENT_STYLES.h1}">${escapeHtml(title)}</h1>
    <p style="${CONTENT_STYLES.p}">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">${features}</table>
    ${button('Set up your profile', `${site}/settings`)}
    <p class="eb-line" style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${COLORS.line};font-family:${SANS};font-size:14px;line-height:1.7;color:${COLORS.body};">
      ${escapeHtml(newsletter)}${
        options.subscribed
          ? ''
          : ` <a href="${escapeHtml(`${site}/newsletter`)}" style="color:${COLORS.link};font-weight:600;text-decoration:none;" class="eb-link">Subscribe to the newsletter &rarr;</a>`
      }
    </p>
  `;

  return {
    html: layout({
      siteUrl: site,
      logoSrc: options.logoSrc,
      title,
      preheader: 'Your account is ready. Here is what you can do with it.',
      label: 'Account',
      body,
      reason,
      postalAddress: options.postalAddress,
    }),
    text: textBody([
      title,
      '',
      intro,
      '',
      ...ACCOUNT_FEATURES.flatMap(([name, detail]) => [`- ${name}: ${detail}`]),
      '',
      `Set up your profile: ${site}/settings`,
      '',
      newsletter,
      options.subscribed ? null : `Subscribe: ${site}/newsletter`,
      '',
      textFooter(reason, site, undefined, options.postalAddress),
    ]),
  };
}
