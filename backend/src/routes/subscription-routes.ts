import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  createSubscription,
  listSubscriptions,
  unsubscribe,
  oneClickUnsubscribe,
  oneClickRedirect,
  getSubscriptionStats,
  getMySubscription,
  confirmSubscription,
} from '../controllers/subscription-controller.js';
import { validateBody } from '../middleware/validate.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';
import { subscribeLimiter } from '../middleware/rate-limit.js';

const router = createRouter();

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  topics: z.array(z.string().max(50)).max(20).default([]),
});

const tokenSchema = z.object({
  token: z.string().min(1).max(100),
});

router.get('/stats', getSubscriptionStats);
router.get('/me', requireAuth, getMySubscription);
router.post('/confirm', validateBody(tokenSchema), confirmSubscription);
router.post('/unsubscribe', validateBody(tokenSchema), unsubscribe);
router.post('/unsubscribe/one-click', oneClickUnsubscribe);
router.get('/unsubscribe/one-click', oneClickRedirect);
router.get('/', requireAuth, requireRole('ADMIN'), listSubscriptions);
router.post('/', subscribeLimiter, optionalAuth, validateBody(subscribeSchema), createSubscription);

export default router;
