import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';
import { isValidTimeZone, sourceName } from '../utils/analytics.js';

const INTERVALS = ['hour', 'day', 'week', 'month', 'year'] as const;
type Interval = (typeof INTERVALS)[number];

const INTERVAL_HOURS: Record<Interval, number> = {
  hour: 1,
  day: 24,
  week: 168,
  month: 730,
  year: 8760,
};
const MAX_BUCKETS = 400;

const rangeSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  interval: z.enum(INTERVALS).optional(),
  tz: z.string().max(64).optional(),
});

export interface Range {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  interval: Interval;
  tz: string;
}

class RangeError extends Error {}

function autoInterval(hours: number): Interval {
  if (hours <= 48) return 'hour';
  if (hours <= 24 * 95) return 'day';
  if (hours <= 24 * 190) return 'week';
  if (hours <= 24 * 365 * 5) return 'month';
  return 'year';
}

/** Columns are stored as UTC without a zone, so parameters are passed the same way. */
const utc = (date: Date) => date.toISOString().slice(0, 23).replace('T', ' ');

async function resolveRange(req: Request): Promise<Range> {
  const parsed = rangeSchema.safeParse(req.query);
  if (!parsed.success) throw new RangeError('Use ISO dates for from and to, and a valid interval.');
  const { from: rawFrom, to: rawTo, interval: wanted, tz: rawTz } = parsed.data;

  const tz = rawTz && isValidTimeZone(rawTz) ? rawTz : 'UTC';
  const to = rawTo ? new Date(rawTo) : new Date();
  let from: Date;
  if (rawFrom) {
    from = new Date(rawFrom);
  } else {
    const [{ first }] = await prisma.$queryRaw<{ first: Date | null }[]>`
      SELECT LEAST(
        (SELECT min("createdAt") FROM "PageView"),
        (SELECT min("createdAt") FROM "User"),
        (SELECT min("publishedAt") FROM "Article" WHERE "status" = 'PUBLISHED')
      ) AS first`;
    from = first ?? new Date(to.getTime() - 30 * 86_400_000);
  }
  if (!(from < to)) throw new RangeError('The start of the range must be before its end.');

  const hours = (to.getTime() - from.getTime()) / 3_600_000;
  let interval = wanted ?? autoInterval(hours);
  // Too many points is unreadable and slow; step up to the next coarser interval instead.
  while (hours / INTERVAL_HOURS[interval] > MAX_BUCKETS && interval !== 'year') {
    interval = INTERVALS[INTERVALS.indexOf(interval) + 1];
  }

  const span = to.getTime() - from.getTime();
  return {
    from,
    to,
    previousFrom: new Date(from.getTime() - span),
    previousTo: from,
    interval,
    tz,
  };
}

function withRange(handler: (req: Request, res: Response, range: Range) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    let range: Range;
    try {
      range = await resolveRange(req);
    } catch (error) {
      if (error instanceof RangeError) return res.status(400).json({ error: error.message });
      throw error;
    }
    return handler(req, res, range);
  };
}

const between = (column: string, from: Date, to: Date) =>
  Prisma.sql`${Prisma.raw(column)} >= ${utc(from)}::timestamp AND ${Prisma.raw(column)} < ${utc(to)}::timestamp`;

const localTime = (column: string, tz: string) =>
  Prisma.sql`((${Prisma.raw(column)} AT TIME ZONE 'UTC') AT TIME ZONE ${tz})`;

const bucketOf = (column: string, range: Range) =>
  Prisma.sql`to_char(date_trunc(${range.interval}, ${localTime(column, range.tz)}), 'YYYY-MM-DD"T"HH24:MI')`;

async function bucketKeys(range: Range, from: Date, to: Date): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ bucket: string }[]>`
    SELECT to_char(b, 'YYYY-MM-DD"T"HH24:MI') AS bucket
    FROM generate_series(
      date_trunc(${range.interval}, (${utc(from)}::timestamp AT TIME ZONE 'UTC') AT TIME ZONE ${range.tz}),
      date_trunc(${range.interval}, ((${utc(to)}::timestamp - interval '1 millisecond') AT TIME ZONE 'UTC') AT TIME ZONE ${range.tz}),
      ${`1 ${range.interval}`}::interval
    ) AS b`;
  return rows.map((r) => r.bucket);
}

const EVENT_KINDS = [
  'signups',
  'published',
  'comments',
  'claps',
  'bookmarks',
  'subscribers',
  'unsubscribes',
] as const;
type EventKind = (typeof EVENT_KINDS)[number];

/** Every product event with its timestamp, restricted to one window. */
const events = (from: Date, to: Date) => Prisma.sql`
  SELECT 'signups' AS kind, "createdAt" AS at FROM "User" WHERE ${between('"createdAt"', from, to)}
  UNION ALL SELECT 'published', "publishedAt" FROM "Article" WHERE "status" = 'PUBLISHED' AND ${between('"publishedAt"', from, to)}
  UNION ALL SELECT 'comments', "createdAt" FROM "Comment" WHERE ${between('"createdAt"', from, to)}
  UNION ALL SELECT 'claps', "createdAt" FROM "Like" WHERE ${between('"createdAt"', from, to)}
  UNION ALL SELECT 'bookmarks', "createdAt" FROM "Bookmark" WHERE ${between('"createdAt"', from, to)}
  UNION ALL SELECT 'subscribers', "createdAt" FROM "Subscription" WHERE "status" <> 'PENDING' AND ${between('"createdAt"', from, to)}
  UNION ALL SELECT 'unsubscribes', "unsubscribedAt" FROM "Subscription" WHERE ${between('"unsubscribedAt"', from, to)}
`;

type Traffic = { pageviews: number; visitors: number; sessions: number };
type Point = Traffic & Record<EventKind, number> & { bucket: string };

async function series(range: Range, from: Date, to: Date): Promise<Point[]> {
  const [keys, traffic, activity] = await Promise.all([
    bucketKeys(range, from, to),
    prisma.$queryRaw<(Traffic & { bucket: string })[]>`
      SELECT ${bucketOf('"createdAt"', range)} AS bucket,
             count(*)::int AS pageviews,
             count(DISTINCT "visitorId")::int AS visitors,
             count(DISTINCT "sessionId")::int AS sessions
      FROM "PageView" WHERE ${between('"createdAt"', from, to)}
      GROUP BY 1`,
    prisma.$queryRaw<{ bucket: string; kind: EventKind; n: number }[]>`
      SELECT ${bucketOf('e.at', range)} AS bucket, e.kind, count(*)::int AS n
      FROM (${events(from, to)}) e
      GROUP BY 1, 2`,
  ]);

  const empty = () => ({
    pageviews: 0,
    visitors: 0,
    sessions: 0,
    ...Object.fromEntries(EVENT_KINDS.map((k) => [k, 0])),
  });
  const points = new Map<string, Point>(
    keys.map((bucket) => [bucket, { bucket, ...empty() } as Point])
  );
  for (const row of traffic) Object.assign(points.get(row.bucket) ?? {}, row);
  for (const row of activity) {
    const point = points.get(row.bucket);
    if (point) point[row.kind] = row.n;
  }
  return [...points.values()];
}

async function summary(from: Date, to: Date) {
  const [[visits], activity] = await Promise.all([
    prisma.$queryRaw<
      {
        sessions: number;
        pageviews: number;
        visitors: number;
        bounces: number;
        avgDuration: number;
      }[]
    >`
      SELECT count(*)::int AS sessions,
             COALESCE(sum(views), 0)::int AS pageviews,
             count(DISTINCT visitor)::int AS visitors,
             count(*) FILTER (WHERE views = 1 AND engaged < 10)::int AS bounces,
             COALESCE(avg(engaged), 0)::float AS "avgDuration"
      FROM (
        SELECT "sessionId", min("visitorId") AS visitor, count(*) AS views, sum("duration") AS engaged
        FROM "PageView" WHERE ${between('"createdAt"', from, to)}
        GROUP BY 1
      ) s`,
    prisma.$queryRaw<{ kind: EventKind; n: number }[]>`
      SELECT e.kind, count(*)::int AS n FROM (${events(from, to)}) e GROUP BY 1`,
  ]);

  const counts = Object.fromEntries(EVENT_KINDS.map((k) => [k, 0])) as Record<EventKind, number>;
  for (const row of activity) counts[row.kind] = row.n;

  return {
    visitors: visits.visitors,
    pageviews: visits.pageviews,
    sessions: visits.sessions,
    // A bounce is a visit that saw one page and left within ten seconds.
    bounceRate: visits.sessions ? visits.bounces / visits.sessions : 0,
    avgDuration: Math.round(visits.avgDuration),
    viewsPerVisit: visits.sessions ? visits.pageviews / visits.sessions : 0,
    ...counts,
  };
}

const rangeInfo = (range: Range) => ({
  from: range.from.toISOString(),
  to: range.to.toISOString(),
  previousFrom: range.previousFrom.toISOString(),
  previousTo: range.previousTo.toISOString(),
  interval: range.interval,
  tz: range.tz,
});

export const getOverview = withRange(async (_req, res, range) => {
  const { from, to, previousFrom, previousTo } = range;
  const [current, previous, currentSeries, previousSeries, [baseline], roles, [totals]] =
    await Promise.all([
      summary(from, to),
      summary(previousFrom, previousTo),
      series(range, from, to),
      series(range, previousFrom, previousTo),
      prisma.$queryRaw<{ users: number; subscribers: number }[]>`
      SELECT
        (SELECT count(*) FROM "User" WHERE "createdAt" < ${utc(from)}::timestamp)::int AS users,
        (SELECT count(*) FROM "Subscription"
          WHERE "createdAt" < ${utc(from)}::timestamp
            AND ("status" = 'ACTIVE' OR "unsubscribedAt" >= ${utc(from)}::timestamp))::int AS subscribers`,
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.$queryRaw<
        { subscribers: number; articles: number; pageviews: number; visitors: number }[]
      >`
      SELECT
        (SELECT count(*) FROM "Subscription" WHERE "status" = 'ACTIVE')::int AS subscribers,
        (SELECT count(*) FROM "Article" WHERE "status" = 'PUBLISHED')::int AS articles,
        (SELECT count(*) FROM "PageView")::int AS pageviews,
        (SELECT count(DISTINCT "visitorId") FROM "PageView")::int AS visitors`,
    ]);

  const usersByRole = Object.fromEntries(roles.map((r) => [r.role, r._count._all]));
  return res.json({
    range: rangeInfo(range),
    current,
    previous,
    series: currentSeries,
    previousSeries,
    baseline,
    totals: {
      ...totals,
      users: roles.reduce((sum, r) => sum + r._count._all, 0),
      usersByRole,
    },
  });
});

type Row = { name: string | null; visitors: number; pageviews: number };

export const getBreakdown = withRange(async (_req, res, range) => {
  const inRange = between('"createdAt"', range.from, range.to);
  const dimension = (column: string) => prisma.$queryRaw<Row[]>`
    SELECT ${Prisma.raw(column)} AS name,
           count(DISTINCT "visitorId")::int AS visitors,
           count(*)::int AS pageviews
    FROM "PageView" WHERE ${inRange}
    GROUP BY 1 ORDER BY visitors DESC, pageviews DESC LIMIT 50`;

  const [
    pages,
    entryPages,
    exitPages,
    entries,
    campaigns,
    countries,
    devices,
    browsers,
    os,
    [visitorTypes],
  ] = await Promise.all([
    prisma.$queryRaw<{ path: string; pageviews: number; visitors: number; avgDuration: number }[]>`
        SELECT "path", count(*)::int AS pageviews, count(DISTINCT "visitorId")::int AS visitors,
               COALESCE(avg(NULLIF("duration", 0)), 0)::float AS "avgDuration"
        FROM "PageView" WHERE ${inRange}
        GROUP BY 1 ORDER BY pageviews DESC LIMIT 100`,
    prisma.$queryRaw<{ path: string; visits: number }[]>`
        SELECT "path", count(*)::int AS visits FROM "PageView"
        WHERE ${inRange} AND "isEntry"
        GROUP BY 1 ORDER BY visits DESC LIMIT 50`,
    prisma.$queryRaw<{ path: string; visits: number }[]>`
        SELECT "path", count(*)::int AS visits FROM (
          SELECT DISTINCT ON ("sessionId") "path" FROM "PageView"
          WHERE ${inRange} ORDER BY "sessionId", "createdAt" DESC
        ) last GROUP BY 1 ORDER BY visits DESC LIMIT 50`,
    prisma.$queryRaw<
      { referrer: string | null; utmSource: string | null; visits: number; visitors: number }[]
    >`
        SELECT "referrer", "utmSource", count(*)::int AS visits, count(DISTINCT "visitorId")::int AS visitors
        FROM "PageView" WHERE ${inRange} AND "isEntry"
        GROUP BY 1, 2`,
    prisma.$queryRaw<
      {
        campaign: string;
        source: string | null;
        medium: string | null;
        visits: number;
        visitors: number;
      }[]
    >`
        SELECT "utmCampaign" AS campaign, "utmSource" AS source, "utmMedium" AS medium,
               count(*)::int AS visits, count(DISTINCT "visitorId")::int AS visitors
        FROM "PageView" WHERE ${inRange} AND "isEntry" AND "utmCampaign" IS NOT NULL
        GROUP BY 1, 2, 3 ORDER BY visits DESC LIMIT 50`,
    dimension('"country"'),
    dimension('"device"'),
    dimension('"browser"'),
    dimension('"os"'),
    prisma.$queryRaw<{ new: number; returning: number }[]>`
        SELECT count(*) FILTER (WHERE first_seen >= ${utc(range.from)}::timestamp)::int AS new,
               count(*) FILTER (WHERE first_seen < ${utc(range.from)}::timestamp)::int AS returning
        FROM (
          SELECT v."visitorId",
                 (SELECT min(p."createdAt") FROM "PageView" p WHERE p."visitorId" = v."visitorId") AS first_seen
          FROM (SELECT DISTINCT "visitorId" FROM "PageView" WHERE ${inRange}) v
        ) x`,
  ]);

  const grouped = new Map<string, { name: string; visits: number; visitors: number }>();
  for (const row of entries) {
    const name = sourceName(row.referrer, row.utmSource);
    const entry = grouped.get(name) ?? { name, visits: 0, visitors: 0 };
    entry.visits += row.visits;
    entry.visitors += row.visitors;
    grouped.set(name, entry);
  }
  const referrers = new Map<string, { name: string; visits: number; visitors: number }>();
  for (const row of entries) {
    if (!row.referrer) continue;
    const entry = referrers.get(row.referrer) ?? { name: row.referrer, visits: 0, visitors: 0 };
    entry.visits += row.visits;
    entry.visitors += row.visitors;
    referrers.set(row.referrer, entry);
  }
  const byVisits = (a: { visits: number }, b: { visits: number }) => b.visits - a.visits;

  return res.json({
    range: rangeInfo(range),
    pages,
    entryPages,
    exitPages,
    sources: [...grouped.values()].sort(byVisits),
    referrers: [...referrers.values()].sort(byVisits).slice(0, 50),
    campaigns,
    countries,
    devices,
    browsers,
    os,
    visitorTypes,
  });
});

export const getContent = withRange(async (_req, res, range) => {
  const views = between('p."createdAt"', range.from, range.to);
  const counted = (table: string) => Prisma.sql`
    SELECT "articleId", count(*)::int AS n FROM ${Prisma.raw(table)}
    WHERE ${between('"createdAt"', range.from, range.to)} GROUP BY 1`;

  const [articles, topics, authors] = await Promise.all([
    prisma.$queryRaw`
      WITH v AS (
        SELECT p."articleId", count(*)::int AS views, count(DISTINCT p."visitorId")::int AS visitors,
               COALESCE(avg(NULLIF(p."duration", 0)), 0)::float AS "avgDuration",
               COALESCE(avg(p."scrollDepth") FILTER (WHERE p."scrollDepth" > 0), 0)::float AS "avgScroll"
        FROM "PageView" p WHERE p."articleId" IS NOT NULL AND ${views}
        GROUP BY 1
      ),
      claps AS (${counted('"Like"')}),
      comments AS (${counted('"Comment"')}),
      bookmarks AS (${counted('"Bookmark"')})
      SELECT a."id", a."title", a."slug", a."publishedAt", a."category",
             u."name" AS "authorName", u."username" AS "authorUsername",
             COALESCE(v.views, 0) AS views, COALESCE(v.visitors, 0) AS visitors,
             COALESCE(v."avgDuration", 0) AS "avgDuration", COALESCE(v."avgScroll", 0) AS "avgScroll",
             COALESCE(claps.n, 0) AS claps, COALESCE(comments.n, 0) AS comments, COALESCE(bookmarks.n, 0) AS bookmarks
      FROM "Article" a
      JOIN "User" u ON u."id" = a."authorId"
      LEFT JOIN v ON v."articleId" = a."id"
      LEFT JOIN claps ON claps."articleId" = a."id"
      LEFT JOIN comments ON comments."articleId" = a."id"
      LEFT JOIN bookmarks ON bookmarks."articleId" = a."id"
      WHERE a."status" = 'PUBLISHED'
      ORDER BY views DESC, a."publishedAt" DESC
      LIMIT 200`,
    prisma.$queryRaw`
      SELECT t."name", t."slug", count(*)::int AS views,
             count(DISTINCT p."visitorId")::int AS visitors,
             count(DISTINCT p."articleId")::int AS articles
      FROM "PageView" p
      JOIN "TagOnArticle" ta ON ta."articleId" = p."articleId"
      JOIN "Tag" t ON t."id" = ta."tagId"
      WHERE ${views}
      GROUP BY t."id" ORDER BY views DESC LIMIT 20`,
    prisma.$queryRaw`
      SELECT u."id", u."name", u."username", count(*)::int AS views,
             count(DISTINCT p."visitorId")::int AS visitors,
             (SELECT count(*) FROM "Article" a2
               WHERE a2."authorId" = u."id" AND a2."status" = 'PUBLISHED'
                 AND ${between('a2."publishedAt"', range.from, range.to)})::int AS published
      FROM "PageView" p
      JOIN "Article" a ON a."id" = p."articleId"
      JOIN "User" u ON u."id" = a."authorId"
      WHERE ${views}
      GROUP BY u."id" ORDER BY views DESC LIMIT 20`,
  ]);

  return res.json({ range: rangeInfo(range), articles, topics, authors });
});

export const getHeatmap = withRange(async (_req, res, range) => {
  const local = localTime('"createdAt"', range.tz);
  const cells = await prisma.$queryRaw<
    { day: number; hour: number; pageviews: number; visitors: number }[]
  >`
    SELECT extract(isodow FROM ${local})::int AS day, extract(hour FROM ${local})::int AS hour,
           count(*)::int AS pageviews, count(DISTINCT "visitorId")::int AS visitors
    FROM "PageView" WHERE ${between('"createdAt"', range.from, range.to)}
    GROUP BY 1, 2`;
  return res.json({ range: rangeInfo(range), cells });
});

export async function getRealtime(_req: Request, res: Response) {
  const now = Date.now();
  const active = utc(new Date(now - 5 * 60_000));
  const windowStart = new Date(Math.floor((now - 29 * 60_000) / 60_000) * 60_000);

  const [[{ visitors }], pages, countries, minutes] = await Promise.all([
    prisma.$queryRaw<{ visitors: number }[]>`
      SELECT count(DISTINCT "visitorId")::int AS visitors FROM "PageView" WHERE "lastSeenAt" >= ${active}::timestamp`,
    prisma.$queryRaw<{ path: string; visitors: number }[]>`
      SELECT "path", count(DISTINCT "visitorId")::int AS visitors FROM "PageView"
      WHERE "lastSeenAt" >= ${active}::timestamp
      GROUP BY 1 ORDER BY visitors DESC LIMIT 10`,
    prisma.$queryRaw<{ name: string | null; visitors: number }[]>`
      SELECT "country" AS name, count(DISTINCT "visitorId")::int AS visitors FROM "PageView"
      WHERE "lastSeenAt" >= ${active}::timestamp
      GROUP BY 1 ORDER BY visitors DESC LIMIT 5`,
    prisma.$queryRaw<{ minute: string; pageviews: number }[]>`
      SELECT to_char(date_trunc('minute', "createdAt"), 'YYYY-MM-DD"T"HH24:MI') AS minute, count(*)::int AS pageviews
      FROM "PageView" WHERE "createdAt" >= ${utc(windowStart)}::timestamp
      GROUP BY 1`,
  ]);

  const perMinute = new Map(minutes.map((m) => [m.minute, m.pageviews]));
  const timeline = Array.from({ length: 30 }, (_, i) => {
    const minute = new Date(windowStart.getTime() + i * 60_000).toISOString().slice(0, 16);
    return { minute: `${minute}Z`, pageviews: perMinute.get(minute) ?? 0 };
  });

  return res.json({ visitors, pages, countries, timeline });
}

const ACTIVITY_KINDS = [
  'signup',
  'published',
  'comment',
  'clap',
  'bookmark',
  'subscribe',
  'unsubscribe',
] as const;

const activitySchema = z.object({
  kinds: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v.split(',').filter((k) => (ACTIVITY_KINDS as readonly string[]).includes(k))
        : [...ACTIVITY_KINDS]
    ),
  before: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

type ActivityRow = {
  kind: (typeof ACTIVITY_KINDS)[number];
  ref: string;
  at: Date;
  actor: string | null;
  username: string | null;
  title: string | null;
  slug: string | null;
  detail: string | null;
};

/** Everything that happened on the site, newest first, with keyset pagination. */
export async function getActivity(req: Request, res: Response) {
  const parsed = activitySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid activity filter' });
  const { kinds, before, limit, from, to } = parsed.data;
  if (kinds.length === 0) return res.json({ items: [], nextCursor: null });

  let cursor = Prisma.sql`TRUE`;
  if (before) {
    const [at, ref] = before.split('|');
    if (!at || !ref || Number.isNaN(Date.parse(at)))
      return res.status(400).json({ error: 'Invalid cursor' });
    cursor = Prisma.sql`(e.at, e.ref) < (${utc(new Date(at))}::timestamp, ${ref})`;
  }
  const window = Prisma.sql`${from ? Prisma.sql`e.at >= ${utc(new Date(from))}::timestamp` : Prisma.sql`TRUE`}
    AND ${to ? Prisma.sql`e.at < ${utc(new Date(to))}::timestamp` : Prisma.sql`TRUE`}`;

  const rows = await prisma.$queryRaw<ActivityRow[]>`
    SELECT * FROM (
      SELECT 'signup' AS kind, u."id" AS ref, u."createdAt" AS at, u."name" AS actor, u."username",
             NULL::text AS title, NULL::text AS slug, u."role"::text AS detail
      FROM "User" u
      UNION ALL
      SELECT 'published', a."id", a."publishedAt", u."name", u."username", a."title", a."slug", a."category"
      FROM "Article" a JOIN "User" u ON u."id" = a."authorId" WHERE a."status" = 'PUBLISHED'
      UNION ALL
      SELECT 'comment', c."id", c."createdAt", COALESCE(u."name", c."authorName"), u."username", a."title", a."slug", left(c."body", 300)
      FROM "Comment" c JOIN "Article" a ON a."id" = c."articleId" LEFT JOIN "User" u ON u."id" = c."authorId"
      UNION ALL
      SELECT 'clap', l."id", l."createdAt", u."name", u."username", a."title", a."slug", NULL
      FROM "Like" l JOIN "Article" a ON a."id" = l."articleId" LEFT JOIN "User" u ON u."id" = l."userId"
      UNION ALL
      SELECT 'bookmark', b."id", b."createdAt", u."name", u."username", a."title", a."slug", NULL
      FROM "Bookmark" b JOIN "Article" a ON a."id" = b."articleId" JOIN "User" u ON u."id" = b."userId"
      UNION ALL
      SELECT 'subscribe', s."id", s."createdAt", s."email", NULL, NULL, NULL, NULL FROM "Subscription" s
      WHERE s."status" <> 'PENDING'
      UNION ALL
      SELECT 'unsubscribe', s."id", s."unsubscribedAt", s."email", NULL, NULL, NULL, NULL
      FROM "Subscription" s WHERE s."unsubscribedAt" IS NOT NULL
    ) e
    WHERE e.kind = ANY(${kinds}::text[]) AND ${window} AND ${cursor}
    ORDER BY e.at DESC, e.ref DESC
    LIMIT ${limit + 1}`;

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return res.json({
    items: page.map((row) => ({
      ...row,
      id: `${row.kind}:${row.ref}`,
      detail:
        row.kind === 'comment'
          ? row.detail
              ?.replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 160)
          : row.detail,
    })),
    nextCursor: rows.length > limit && last ? `${last.at.toISOString()}|${last.ref}` : null,
  });
}
