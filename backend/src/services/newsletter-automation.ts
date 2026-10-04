import { prisma } from '../prisma/client.js';
import { articleAnnouncementContent, digestContent, emailConfigured } from './email-service.js';
import { startDelivery } from './newsletter-delivery.js';
import { getNewsletterSettings, type Settings } from './newsletter-settings.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Weekday (0 = Sunday), hour, minute and calendar date of an instant in a timezone. */
export function localTime(date: Date, timeZone: string) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, format);
  }
  const parts = Object.fromEntries(format.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: WEEKDAYS.indexOf(parts.weekday),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

type DigestSchedule = Pick<
  Settings,
  'digestEnabled' | 'digestDay' | 'digestHour' | 'digestTimezone'
>;

/** True during the configured hour on the configured day, in the configured timezone. */
export function digestDue(settings: DigestSchedule, now = new Date()) {
  if (!settings.digestEnabled) return false;
  const local = localTime(now, settings.digestTimezone);
  return local.weekday === settings.digestDay && local.hour === settings.digestHour;
}

/** The next time the digest is scheduled to go out, or null when it is off. */
export function nextDigestAt(settings: DigestSchedule, now = new Date()) {
  if (!settings.digestEnabled) return null;
  const step = 15 * 60_000;
  // Quarter-hour steps also land on the hour in zones offset by :30 or :45.
  let t = Math.ceil((now.getTime() + 1) / step) * step;
  for (const end = t + 8 * 24 * 60 * 60_000; t < end; t += step) {
    const local = localTime(new Date(t), settings.digestTimezone);
    if (
      local.minute === 0 &&
      local.weekday === settings.digestDay &&
      local.hour === settings.digestHour
    ) {
      return new Date(t);
    }
  }
  return null;
}

/**
 * Queues a newsletter draft when an article is published for the first time. It is never
 * sent on its own: an admin reviews it on the newsletter page and sends it.
 */
export async function draftArticleNewsletter(articleId: string) {
  if (!(await getNewsletterSettings()).articleDrafts) return false;
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { title: true, description: true, status: true, author: { select: { name: true } } },
  });
  if (article?.status !== 'PUBLISHED') return false;

  const alreadyEmailed = await prisma.newsletterCampaign.count({
    where: { status: { in: ['SENDING', 'SENT'] }, articleIds: { has: articleId } },
  });
  if (alreadyEmailed) return false;

  const { count } = await prisma.newsletterCampaign.createMany({
    data: [
      {
        kind: 'ARTICLE',
        sourceKey: `article:${articleId}`,
        ...(await articleAnnouncementContent({
          title: article.title,
          description: article.description,
          author: article.author?.name,
        })),
        articleIds: [articleId],
      },
    ],
    skipDuplicates: true,
  });
  return count > 0;
}

/** Articles published in the last seven days that no newsletter has covered yet, newest first. */
export async function digestCandidates(now = new Date(), limit?: number) {
  const max = limit ?? (await getNewsletterSettings()).digestMaxArticles;
  const recent = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: new Date(now.getTime() - WEEK_MS), lte: now },
    },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, title: true, slug: true, publishedAt: true },
  });
  if (recent.length === 0) return { articles: [], total: 0 };

  const emailed = await prisma.newsletterCampaign.findMany({
    where: {
      status: { in: ['SENDING', 'SENT'] },
      articleIds: { hasSome: recent.map((a) => a.id) },
    },
    select: { articleIds: true },
  });
  const covered = new Set(emailed.flatMap((c) => c.articleIds));
  const fresh = recent.filter((a) => !covered.has(a.id));
  return { articles: fresh.slice(0, max), total: fresh.length };
}

export type DigestOutcome =
  | { sent: true; campaignId: string; articles: number }
  | { sent: false; reason: string };

/**
 * The weekly roundup of articles no newsletter has covered yet. Skipped when there are
 * none, so a quiet week sends nothing. Sends at most once per day in the digest timezone.
 */
export async function sendWeeklyDigest(now = new Date()): Promise<DigestOutcome> {
  if (!emailConfigured()) return { sent: false, reason: 'Email sending is not set up' };
  const settings = await getNewsletterSettings();

  const { articles: fresh } = await digestCandidates(now, settings.digestMaxArticles);
  if (fresh.length === 0) {
    const anyRecent = await prisma.article.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: new Date(now.getTime() - WEEK_MS), lte: now },
      },
    });
    return {
      sent: false,
      reason: anyRecent
        ? 'Every article from this week was already emailed'
        : 'Nothing was published this week',
    };
  }

  if (!(await prisma.subscription.count({ where: { status: 'ACTIVE' } }))) {
    return { sent: false, reason: 'No active subscribers' };
  }

  const sourceKey = `digest:${localTime(now, settings.digestTimezone).date}`;
  await prisma.newsletterCampaign.createMany({
    data: [
      {
        kind: 'DIGEST',
        sourceKey,
        ...(await digestContent(fresh.map((a) => a.title))),
        articleIds: fresh.map((a) => a.id),
      },
    ],
    skipDuplicates: true,
  });
  const campaign = await prisma.newsletterCampaign.findUniqueOrThrow({ where: { sourceKey } });
  if (!(await startDelivery(campaign.id))) {
    return { sent: false, reason: "Today's digest was already sent" };
  }

  // Drafts still waiting for these articles would repeat what subscribers just received.
  await prisma.newsletterCampaign.deleteMany({
    where: { kind: 'ARTICLE', status: 'DRAFT', articleIds: { hasSome: campaign.articleIds } },
  });
  return { sent: true, campaignId: campaign.id, articles: campaign.articleIds.length };
}

/** Called by the scheduler every few minutes; sends only inside the configured hour. */
export async function runDigestIfDue(now = new Date()) {
  const settings = await getNewsletterSettings();
  if (!digestDue(settings, now)) return null;
  return sendWeeklyDigest(now);
}
