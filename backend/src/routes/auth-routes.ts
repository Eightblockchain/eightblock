import { Router } from 'express';
import { z } from 'zod';
import { walletAuth } from '@/controllers/auth-controller';
import { validateBody } from '@/middleware/validate';

const router = Router();

const walletAuthSchema = z.object({
  walletAddress: z.string().min(10),
});

router.post('/wallet', validateBody(walletAuthSchema), walletAuth);

export default router;
