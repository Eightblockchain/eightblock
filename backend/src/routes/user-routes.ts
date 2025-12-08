import { Router } from 'express';
import { z } from 'zod';
import { getUserByWallet, upsertUser, updateUser } from '@/controllers/user-controller';
import { validateBody } from '@/middleware/validate';

const router = Router();

const upsertUserSchema = z.object({
  walletAddress: z.string().min(10),
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

router.get('/:walletAddress', getUserByWallet);
router.post('/', validateBody(upsertUserSchema), upsertUser);
router.put('/:walletAddress', validateBody(updateUserSchema), updateUser);

export default router;
