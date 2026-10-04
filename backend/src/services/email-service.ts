import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { prisma } from '../prisma/client.js';
import { getFullImageUrl } from '../utils/imgUrl.js';
import { articleCategories, categoryLabel } from '../utils/categories.js';
import {
  renderAccountWelcome,
  renderConfirmSubscription,
  renderNewsletter,
  renderWelcome,
  type EmailArticle,
  type RenderedEmail,
} from './email-template.js';
import { getNewsletterSettings } from './newsletter-settings.js';

const DEFAULT_FROM = 'Eightblock <newsletter@news.eightblock.dev>';
const DEFAULT_TRANSACTIONAL_FROM = 'Eightblock <noreply@news.eightblock.dev>';
/** Resend accepts up to 100 messages per batch call. */
export const BATCH_SIZE = 100;

export const EMAIL_ASSETS_DIR = fileURLToPath(new URL('../../assets/email', import.meta.url));
const LOGO_CID = 'eightblock-logo';
let logoPng: Buffer | null = null;

/**
 * Single sends embed the logo so it shows even when the API is not publicly reachable.
 * Batch sends cannot carry attachments, so campaigns load it from the API instead.
 */
function inlineLogo() {
  logoPng ??= readFileSync(`${EMAIL_ASSETS_DIR}/logo.png`);
  return {
    src: `cid:${LOGO_CID}`,
    attachment: {
      filename: 'eightblock.png',
      content: logoPng,
      contentType: 'image/png',
      inlineContentId: LOGO_CID,
    },
  };
}

const hostedLogo = () => `${config().apiUrl}/email-assets/logo.png`;

function config() {
  const siteUrl = (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://eightblock.dev'
  ).replace(/\/$/, '');
  return {
    apiKey: process.env.EMAIL_PROVIDER_API_KEY?.trim() || null,
    from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
    /** Sender for one-off messages about the reader's own actions, such as welcomes. */
    transactionalFrom: process.env.EMAIL_TRANSACTIONAL_FROM?.trim() || DEFAULT_TRANSACTIONAL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
    postalAddress: process.env.EMAIL_POSTAL_ADDRESS?.trim() || null,
    siteUrl,
    apiUrl: (process.env.API_URL ?? siteUrl).replace(/\/$/, ''),
  };
}

let client: { key: string; resend: Resend } | null = null;
function resend() {
  const { apiKey } = config();
  if (!apiKey) return null;
  if (client?.key !== apiKey) client = { key: apiKey, resend: new Resend(apiKey) };
  return client.resend;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Email sending is not set up: EMAIL_PROVIDER_API_KEY is empty.');
  }
}

export const emailConfigured = () => Boolean(config().apiKey);

/** Senders from .env, used for any field the dashboard leaves empty. */
export function senderDefaults() {
  const { from, transactionalFrom, replyTo, postalAddress } = config();
  return { fromAddress: from, transactionalFrom, replyTo: replyTo ?? null, postalAddress };
}

async function senders() {
  const settings = await getNewsletterSettings();
  const defaults = senderDefaults();
  return {
    settings,
    from: settings.fromAddress ?? defaults.fromAddress,
    transactionalFrom: settings.transactionalFrom ?? defaults.transactionalFrom,
    replyTo: settings.replyTo ?? defaults.replyTo ?? undefined,
    postalAddress: settings.postalAddress ?? defaults.postalAddress,
  };
}

export async function emailStatus() {
  const { from, replyTo } = await senders();
  return {
    configured: emailConfigured(),
    from,
    replyTo: replyTo ?? null,
    siteUrl: config().siteUrl,
  };
}

export function unsubscribeLinks(token: string) {
  const { siteUrl, apiUrl } = config();
  const encoded = encodeURIComponent(token);
  return {
    page: `${siteUrl}/newsletter/unsubscribe?token=${encoded}`,
    oneClick: `${apiUrl}/api/subscriptions/unsubscribe/one-click?token=${encoded}`,
  };
}

/** RFC 8058 one-click unsubscribe; Gmail and Yahoo require it from bulk senders. */
function listHeaders(token: string) {
  return {
    'List-Unsubscribe': `<${unsubscribeLinks(token).oneClick}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

export function campaignSlug(subject: string) {
  return (
    subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'newsletter'
  );
}

/** Adds newsletter UTM tags to links that point at the site; other links are left alone. */
export function trackUrl(href: string, subject: string, base = config().siteUrl): string {
  const siteHost = new URL(base).hostname.replace(/^www\./, '');
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (url.hostname.replace(/^www\./, '') !== siteHost || url.searchParams.has('utm_source'))
    return href;
  url.searchParams.set('utm_source', 'newsletter');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', campaignSlug(subject));
  return url.toString();
}

/**
 * Tags links back to the site so visits from a campaign show up under "Newsletter & email"
 * with the campaign name in analytics. Links that already carry utm_source are left alone.
 */
export function withCampaignTracking(
  html: string,
  subject: string,
  base = config().siteUrl
): string {
  return html.replace(/href=(["'])(.*?)\1/gi, (match, quote: string, href: string) => {
    const tracked = trackUrl(href.replace(/&amp;/g, '&'), subject, base);
    return tracked === href.replace(/&amp;/g, '&')
      ? match
      : `href=${quote}${tracked.replace(/&/g, '&amp;')}${quote}`;
  });
}

const readingMinutes = (html: string) =>
  Math.max(
    1,
    Math.round(
      html
        .replace(/<[^>]+>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length / 225
    )
  );

/** Published articles as email cards, in the order given, or the latest ones when no ids are passed. */
export async function loadEmailArticles(ids: string[] | null, latest = 3): Promise<EmailArticle[]> {
  const { siteUrl } = config();
  const rows = await prisma.article.findMany({
    where: { status: 'PUBLISHED', ...(ids && { id: { in: ids } }) },
    orderBy: { publishedAt: 'desc' },
    take: ids ? undefined : latest,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      categories: articleCategories,
      featuredImage: true,
      author: { select: { name: true } },
    },
  });
  const ordered = ids
    ? ids.map((id) => rows.find((r) => r.id === id)).filter((r) => r !== undefined)
    : rows;
  return ordered.map((a) => ({
    title: a.title,
    url: `${siteUrl}/articles/${a.slug}`,
    excerpt: a.description,
    category: categoryLabel(a.categories),
    author: a.author?.name ?? null,
    imageUrl: a.featuredImage ? getFullImageUrl(a.featuredImage) : null,
    readingMinutes: readingMinutes(a.content),
  }));
}

export interface CampaignContent {
  id?: string;
  subject: string;
  preheader?: string | null;
  htmlContent: string;
  articleIds: string[];
}

interface CampaignRenderOptions {
  unsubscribeUrl?: string;
  logoSrc?: string;
  postalAddress?: string | null;
}

function renderCampaign(
  campaign: CampaignContent,
  articles: EmailArticle[],
  { unsubscribeUrl, logoSrc = hostedLogo(), postalAddress }: CampaignRenderOptions
): RenderedEmail {
  const { siteUrl } = config();
  return renderNewsletter({
    subject: campaign.subject,
    preheader: campaign.preheader,
    html: withCampaignTracking(campaign.htmlContent, campaign.subject),
    articles: articles.map((a) => ({ ...a, url: trackUrl(a.url, campaign.subject) })),
    siteUrl,
    logoSrc,
    unsubscribeUrl,
    postalAddress,
  });
}

/** The editor preview: exactly what subscribers get, with a placeholder unsubscribe link. */
export async function previewCampaign(campaign: CampaignContent) {
  const articles = await loadEmailArticles(campaign.articleIds);
  const { postalAddress } = await senders();
  return renderCampaign(campaign, articles, { unsubscribeUrl: '#', postalAddress });
}

export async function sendConfirmSubscriptionEmail(email: string, confirmToken: string) {
  const mailer = resend();
  if (!mailer) {
    console.warn('[email] EMAIL_PROVIDER_API_KEY not set - skipping confirmation email');
    return null;
  }
  const { siteUrl } = config();
  const { transactionalFrom, replyTo, postalAddress, settings } = await senders();
  const logo = inlineLogo();
  const { html, text } = renderConfirmSubscription({
    email,
    confirmUrl: `${siteUrl}/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`,
    siteUrl,
    logoSrc: logo.src,
    expiresInDays: settings.confirmExpiryDays,
    postalAddress,
  });

  const result = await mailer.emails.send({
    from: transactionalFrom,
    to: email,
    replyTo,
    subject: 'Confirm your Eightblock newsletter subscription',
    html,
    text,
    attachments: [logo.attachment],
    tags: [{ name: 'category', value: 'subscription-confirm' }],
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Sent once the address is confirmed; `returning` is someone who had unsubscribed and came back. */
export async function sendSubscriptionEmail(
  email: string,
  unsubscribeToken: string,
  { returning = false } = {}
) {
  const mailer = resend();
  if (!mailer) {
    console.warn('[email] EMAIL_PROVIDER_API_KEY not set - skipping subscription email');
    return null;
  }
  const { siteUrl } = config();
  const { transactionalFrom, replyTo, postalAddress, settings } = await senders();
  if (!settings.welcomeEmail) return null;
  const articles = await loadEmailArticles(null, 3);
  const logo = inlineLogo();
  const { html, text } = renderWelcome({
    returning,
    articles: articles.map((a) => ({ ...a, url: trackUrl(a.url, 'welcome') })),
    siteUrl,
    logoSrc: logo.src,
    unsubscribeUrl: unsubscribeLinks(unsubscribeToken).page,
    postalAddress,
  });

  const result = await mailer.emails.send({
    from: transactionalFrom,
    to: email,
    replyTo,
    subject: returning
      ? "You're back on the Eightblock newsletter"
      : "You're subscribed to the Eightblock newsletter",
    html,
    text,
    headers: listHeaders(unsubscribeToken),
    attachments: [logo.attachment],
    tags: [{ name: 'category', value: returning ? 'resubscribed' : 'subscribed' }],
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function sendAccountWelcomeEmail(user: { email: string; name: string | null }) {
  const mailer = resend();
  if (!mailer) {
    console.warn('[email] EMAIL_PROVIDER_API_KEY not set - skipping account welcome email');
    return null;
  }
  const { siteUrl } = config();
  const { transactionalFrom, replyTo, postalAddress, settings } = await senders();
  if (!settings.accountWelcome) return null;
  const subscription = await prisma.subscription.findUnique({
    where: { email: user.email },
    select: { status: true },
  });
  const logo = inlineLogo();
  const { html, text } = renderAccountWelcome({
    name: user.name,
    email: user.email,
    subscribed: subscription?.status === 'ACTIVE',
    siteUrl,
    logoSrc: logo.src,
    postalAddress,
  });

  const result = await mailer.emails.send({
    from: transactionalFrom,
    to: user.email,
    replyTo,
    subject: 'Welcome to Eightblock, your account is ready',
    html,
    text,
    attachments: [logo.attachment],
    tags: [{ name: 'category', value: 'account-welcome' }],
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function sendTestNewsletter(to: string, campaign: CampaignContent) {
  const mailer = resend();
  if (!mailer) throw new EmailNotConfiguredError();
  const { from, replyTo, postalAddress } = await senders();
  const articles = await loadEmailArticles(campaign.articleIds);
  const logo = inlineLogo();
  const { html, text } = renderCampaign(campaign, articles, {
    unsubscribeUrl: unsubscribeLinks('test').page,
    logoSrc: logo.src,
    postalAddress,
  });

  const result = await mailer.emails.send({
    from,
    to,
    replyTo,
    subject: `[Test] ${campaign.subject}`,
    html,
    text,
    attachments: [logo.attachment],
    tags: [{ name: 'category', value: 'newsletter-test' }],
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export interface Recipient {
  email: string;
  unsubscribeToken: string;
}

export interface DeliveryResult {
  email: string;
  providerId?: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sends one batch (at most BATCH_SIZE), retrying briefly when Resend rate-limits. */
export async function sendNewsletterBatch(
  recipients: Recipient[],
  campaign: CampaignContent,
  articles: EmailArticle[]
): Promise<DeliveryResult[]> {
  const mailer = resend();
  if (!mailer) throw new EmailNotConfiguredError();
  const { from, replyTo, postalAddress } = await senders();

  const payload = recipients.map((r) => {
    const { html, text } = renderCampaign(campaign, articles, {
      unsubscribeUrl: unsubscribeLinks(r.unsubscribeToken).page,
      postalAddress,
    });
    return {
      from,
      to: r.email,
      replyTo,
      subject: campaign.subject,
      html,
      text,
      headers: listHeaders(r.unsubscribeToken),
      tags: [
        { name: 'category', value: 'newsletter' },
        ...(campaign.id ? [{ name: 'campaign', value: campaign.id }] : []),
      ],
    };
  });

  for (let attempt = 0; ; attempt++) {
    const result = await mailer.batch.send(payload);
    if (!result.error) {
      return recipients.map((r, i) => ({ email: r.email, providerId: result.data.data[i]?.id }));
    }
    if (result.error.name === 'rate_limit_exceeded' && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    return recipients.map((r) => ({ email: r.email, error: result.error.message }));
  }
}
