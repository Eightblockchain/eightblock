import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { UAParser } from 'ua-parser-js';
import { cache } from '@/utils/cache';

// Track article view with analytics
export async function trackView(req: Request, res: Response) {
  const { articleId } = req.params;
  const { visitorId, timeOnPage, scrollDepth, referrer } = req.body;

  if (!visitorId) {
    return res.status(400).json({ error: 'Visitor ID is required' });
  }

  try {
    // Parse user agent for device/browser info
    const userAgent = req.headers['user-agent'] as string;
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();

    // Get IP address (handle proxies)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      req.socket.remoteAddress;

    // Check if this is a unique view (same visitor within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingView = await prisma.articleView.findFirst({
      where: {
        articleId,
        visitorId,
        viewedAt: { gte: oneDayAgo },
      },
    });

    const isUniqueView = !existingView;

    // Create view record
    const view = await prisma.articleView.create({
      data: {
        articleId,
        visitorId,
        userId: req.user?.userId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        referrer: referrer || req.headers.referer,
        device: deviceInfo.device.type || 'desktop',
        browser: deviceInfo.browser.name,
        os: deviceInfo.os.name,
        timeOnPage,
        scrollDepth,
      },
    });

    // Update article view counters
    await prisma.article.update({
      where: { id: articleId },
      data: {
        viewCount: { increment: 1 },
        ...(isUniqueView && { uniqueViews: { increment: 1 } }),
      },
    });

    return res.status(201).json({
      success: true,
      viewId: view.id,
      isUniqueView,
    });
  } catch (error) {
    console.error('View tracking error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
}

// Get article analytics
export async function getArticleAnalytics(req: Request, res: Response) {
  const { articleId } = req.params;
  const { period = '7d' } = req.query;

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        viewCount: true,
        uniqueViews: true,
        createdAt: true,
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Calculate date range
    const days = parseInt(period.toString().replace('d', '')) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get views in period
    const views = await prisma.articleView.findMany({
      where: {
        articleId,
        viewedAt: { gte: startDate },
      },
      select: {
        viewedAt: true,
        device: true,
        browser: true,
        country: true,
        referrer: true,
        timeOnPage: true,
        scrollDepth: true,
      },
    });

    // Calculate analytics
    const totalViews = views.length;
    const uniqueVisitors = new Set(views.map((v) => v.viewedAt.toDateString())).size;

    // Device breakdown
    const deviceStats = views.reduce(
      (acc, v) => {
        const device = v.device || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Browser breakdown
    const browserStats = views.reduce(
      (acc, v) => {
        const browser = v.browser || 'unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Average metrics
    const validTimeOnPage = views.filter((v) => v.timeOnPage).map((v) => v.timeOnPage!);
    const avgTimeOnPage = validTimeOnPage.length
      ? Math.round(validTimeOnPage.reduce((a, b) => a + b, 0) / validTimeOnPage.length)
      : 0;

    const validScrollDepth = views.filter((v) => v.scrollDepth).map((v) => v.scrollDepth!);
    const avgScrollDepth = validScrollDepth.length
      ? Math.round(validScrollDepth.reduce((a, b) => a + b, 0) / validScrollDepth.length)
      : 0;

    // Top referrers
    const referrerStats = views
      .filter((v) => v.referrer)
      .reduce(
        (acc, v) => {
          const ref = v.referrer!;
          acc[ref] = (acc[ref] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const topReferrers = Object.entries(referrerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    // Views by day
    const viewsByDay = views.reduce(
      (acc, v) => {
        const date = v.viewedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return res.json({
      article: {
        id: article.id,
        title: article.title,
        totalViews: article.viewCount,
        totalUniqueViews: article.uniqueViews,
      },
      period: {
        days,
        startDate,
        views: totalViews,
        uniqueVisitors,
      },
      metrics: {
        avgTimeOnPage, // seconds
        avgScrollDepth, // percentage
      },
      breakdown: {
        devices: deviceStats,
        browsers: browserStats,
      },
      topReferrers,
      viewsByDay,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// Get trending articles based on recent views
export async function getTrendingArticles(req: Request, res: Response) {
  const { limit = 10, period = '7d' } = req.query;

  try {
    // Try cache first (cached for 15 minutes)
    const cacheKey = `${cache.trendingKey()}:${limit}:${period}`;
    const cached = await cache.get<any[]>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const days = parseInt(period.toString().replace('d', '')) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get articles with view counts in period - optimized fields
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        featuredImage: true,
        publishedAt: true,
        viewCount: true,
        uniqueViews: true,
        author: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: {
              where: {
                viewedAt: { gte: startDate },
              },
            },
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: parseInt(limit.toString()),
    });

    // Cache for 15 minutes
    await cache.set(cacheKey, articles, 900);

    return res.json(articles);
  } catch (error) {
    console.error('Trending articles error:', error);
    return res.status(500).json({ error: 'Failed to fetch trending articles' });
  }
}
