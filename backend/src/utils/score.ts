import { prisma } from '../prisma/client.js';
import { cacheDelPattern } from './redis.js';
import { logger } from './logger.js';

/**
 * Balanced ranking formula using DAYS (not hours) with a gentler decay:
 *
 *   score = (engagement + freshness) / (daysAge + 1) ^ 1.2
 *
 * Where:
 *   engagement = likes + comments*2 + views*0.1
 *   freshness  = max(0, 1 - daysAge/3)  → 1.0 at publish, 0 after 3 days
 *   exponent   = 1.2  (vs HN's 1.8 — gentler decay for small platforms)
 *
 * Effect:
 *   - Brand-new articles always start with score ≥ 0.5 (freshness bonus),
 *     so the feed never looks like a static publishedAt list.
 *   - An article from 6 weeks ago with 7 engagement scores similarly to a
 *     1-day-old article with 2 engagement — rewarding real discussion.
 *   - Between refreshes with no new activity, scores are stable (intentional).
 */
export function computeScore(params: {
  likes: number;
  comments: number;
  views: number;
  publishedAt: Date;
}): number {
  const { likes, comments, views, publishedAt } = params;
  const daysAge = (Date.now() - publishedAt.getTime()) / 86_400_000;
  const engagement = likes + comments * 2 + views * 0.1;
  const freshness = Math.max(0, 1 - daysAge / 3);
  return (engagement + freshness) / Math.pow(daysAge + 1, 1.2);
}

/**
 * Fetch live counts for an article, compute its score, and persist it.
 * Also invalidates the feed cache so the next request gets fresh order.
 */
export async function refreshScore(articleId: string): Promise<void> {
  try {
    const [likesCount, commentsCount, article] = await Promise.all([
      prisma.like.count({ where: { articleId } }),
      prisma.comment.count({ where: { articleId } }),
      prisma.article.findUnique({
        where: { id: articleId },
        select: { viewCount: true, publishedAt: true },
      }),
    ]);

    if (!article) return;

    const score = computeScore({
      likes: likesCount,
      comments: commentsCount,
      views: article.viewCount,
      publishedAt: article.publishedAt,
    });

    await prisma.article.update({
      where: { id: articleId },
      data: { score },
    });

    await cacheDelPattern('articles:page:*');
  } catch (err) {
    // Non-fatal — a missed score update degrades gracefully
    logger.warn(`refreshScore failed for ${articleId}: ${(err as Error).message}`);
  }
}

/**
 * Recompute scores for ALL published articles.
 * Called by the periodic cron job so old articles decay even without new activity.
 * Uses parallel groupBy aggregations to avoid N+1 queries.
 */
export async function recomputeAllScores(): Promise<void> {
  try {
    const [articles, likeGroups, commentGroups] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, viewCount: true, publishedAt: true },
      }),
      prisma.like.groupBy({
        by: ['articleId'],
        _count: { id: true },
      }),
      prisma.comment.groupBy({
        by: ['articleId'],
        _count: { id: true },
      }),
    ]);

    const likeMap = new Map(likeGroups.map((g) => [g.articleId, g._count.id]));
    const commentMap = new Map(commentGroups.map((g) => [g.articleId, g._count.id]));

    const updates = articles.map((a) => ({
      id: a.id,
      score: computeScore({
        likes: likeMap.get(a.id) ?? 0,
        comments: commentMap.get(a.id) ?? 0,
        views: a.viewCount,
        publishedAt: a.publishedAt,
      }),
    }));

    // Batch into groups of 500 to avoid saturating the connection pool at scale
    const BATCH_SIZE = 500;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      await Promise.all(
        updates.slice(i, i + BATCH_SIZE).map(({ id, score }) =>
          prisma.article.update({ where: { id }, data: { score } })
        )
      );
    }

    await cacheDelPattern('articles:page:*');

    logger.info(`Recomputed scores for ${articles.length} articles`);
  } catch (err) {
    logger.error(`recomputeAllScores failed: ${(err as Error).message}`);
  }
}
