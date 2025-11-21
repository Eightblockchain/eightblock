import { Router } from 'express';
import { z } from 'zod';
import { createSubscription, listSubscriptions } from '@/controllers/subscription-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router();

const bodySchema = z.object({
  email: z.string().email(),
  topics: z.array(z.string()).default([]),
});

router.get('/', requireAuth, listSubscriptions);
router.post('/', validateBody(bodySchema), createSubscription);

export default router;
