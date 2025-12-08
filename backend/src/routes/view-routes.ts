import { Router } from 'express';
import { z } from 'zod';
import { trackView, getArticleAnalytics, getTrendingArticles } from '@/controllers/view-controller';
import { validateBody } from '@/middleware/validate';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

const trackViewSchema = z.object({
  visitorId: z.string().min(1),
  timeOnPage: z.number().optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
  referrer: z.string().optional(),
});

// Track a view
router.post('/:articleId/track', optionalAuth, validateBody(trackViewSchema), trackView);

// Get article analytics
router.get('/:articleId/analytics', getArticleAnalytics);

// Get trending articles
router.get('/trending', getTrendingArticles);

export default router;
