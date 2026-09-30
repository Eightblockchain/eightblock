import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';
import {
  articleSlugFromPath,
  detectCountry,
  isBot,
  isTrackablePath,
  normalizePath,
  parseUserAgent,
  referrerHost,
} from '../utils/analytics.js';
import { logger } from '../utils/logger.js';
import { refreshScore } from '../utils/score.js';

const SESSION_IDLE_MS = 30 * 60 * 1000;
/** A reader adds to an article's public view count at most once per this window. */
const VIEW_REPEAT_MS = 30 * 60 * 1000;
const MAX_DURATION = 30 * 60;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(500)
    .transform((v) => v.slice(0, max) || undefined);

const collectSchema = z.object({
  path: z.string().min(1).max(2000),
  referrer: z.string().max(2000).optional(),
  timezone: z.string().max(64).optional(),
  utm: z
    .object({
      source: text(100).optional(),
      medium: text(100).optional(),
      campaign: text(150).optional(),
    })
    .optional(),
});

const pingSchema = z.object({
  duration: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60),
  scrollDepth: z.number().int().min(0).max(100).optional(),
});

/** Beacons arrive as text/plain so browsers send them without a CORS preflight. */
function payload(req: Request): unknown {
  if (typeof req.body !== 'string') return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return null;
  }
}

export async function collectPageView(req: Request, res: Response) {
  const parsed = collectSchema.safeParse(payload(req));
  if (!parsed.success) return res.status(400).json({ error: 'Invalid analytics event' });

  const userAgent = req.get('user-agent');
  const path = normalizePath(parsed.data.path);
  if (isBot(userAgent) || !path || !isTrackablePath(path)) return res.status(204).end();

  const visitorId = req.visitorId!;
  const userId = req.user?.userId ?? null;
  const now = new Date();

  try {
    const [recent, article] = await Promise.all([
      prisma.pageView.findFirst({
        where: { visitorId, lastSeenAt: { gte: new Date(now.getTime() - SESSION_IDLE_MS) } },
        orderBy: { lastSeenAt: 'desc' },
        select: { sessionId: true },
      }),
      (() => {
        const slug = articleSlugFromPath(path);
        return slug
          ? prisma.article.findUnique({
              where: { slug },
              select: { id: true, authorId: true, status: true, viewCount: true },
            })
          : null;
      })(),
    ]);

    const isEntry = !recent;
    const { utm, referrer, timezone } = parsed.data;
    const data = {
      visitorId,
      sessionId: recent?.sessionId ?? randomUUID(),
      userId,
      path,
      articleId: article?.id ?? null,
      isEntry,
      ...(isEntry && {
        referrer: referrerHost(referrer),
        utmSource: utm?.source?.toLowerCase(),
        utmMedium: utm?.medium?.toLowerCase(),
        utmCampaign: utm?.campaign,
      }),
      country: detectCountry(req, timezone),
      ...parseUserAgent(userAgent),
      createdAt: now,
      lastSeenAt: now,
    };

    if (!article) {
      const view = await prisma.pageView.create({ data, select: { id: true } });
      return res.status(201).json({ id: view.id, counted: false });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialises one visitor's views of one article, so simultaneous requests count once.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${visitorId}), hashtext(${article.id}))`;
      const previous = await tx.pageView.findFirst({
        where: { visitorId, articleId: article.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const view = await tx.pageView.create({ data, select: { id: true } });

      const counted =
        article.status === 'PUBLISHED' &&
        article.authorId !== userId &&
        (!previous || now.getTime() - previous.createdAt.getTime() >= VIEW_REPEAT_MS);
      if (!counted) return { id: view.id, counted, viewCount: article.viewCount };

      const updated = await tx.article.update({
        where: { id: article.id },
        data: {
          viewCount: { increment: 1 },
          ...(!previous && { uniqueViews: { increment: 1 } }),
        },
        select: { viewCount: true },
      });
      return { id: view.id, counted, viewCount: updated.viewCount };
    });

    if (result.counted) void refreshScore(article.id);
    return res.status(201).json(result);
  } catch (error) {
    logger.error(`collectPageView: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to record page view' });
  }
}

/** Heartbeat and page-leave update: engaged seconds, deepest scroll, and "still here" for realtime. */
export async function updatePageView(req: Request, res: Response) {
  const parsed = pingSchema.safeParse(payload(req));
  if (!parsed.success) return res.status(400).json({ error: 'Invalid analytics event' });

  const duration = Math.min(parsed.data.duration, MAX_DURATION);
  const scrollDepth = parsed.data.scrollDepth ?? 0;

  await prisma.$executeRaw`
    UPDATE "PageView"
    SET "duration" = GREATEST("duration", ${duration}),
        "scrollDepth" = GREATEST(COALESCE("scrollDepth", 0), ${scrollDepth}),
        "lastSeenAt" = (now() AT TIME ZONE 'UTC')
    WHERE "id" = ${req.params.id}
      AND "visitorId" = ${req.visitorId!}
      AND "createdAt" > (now() AT TIME ZONE 'UTC') - interval '6 hours'
  `;
  return res.status(204).end();
}
