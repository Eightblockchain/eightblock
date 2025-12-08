import { Router } from 'express';
import { z } from 'zod';
import {
  getUserByWallet,
  upsertUser,
  updateUser,
  getMyProfile,
  updateMyProfile,
} from '@/controllers/user-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router();

const upsertUserSchema = z.object({
  walletAddress: z.string().min(10),
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, validateBody(updateUserSchema), updateMyProfile);
router.get('/:walletAddress', getUserByWallet);
router.post('/', validateBody(upsertUserSchema), upsertUser);
router.put('/:walletAddress', validateBody(updateUserSchema), updateUser);

export default router;
