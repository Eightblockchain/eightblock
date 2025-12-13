import { Router } from 'express';
import { z } from 'zod';
import {
  getUserByWallet,
  upsertUser,
  updateUser,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getPublicProfile,
} from '@/controllers/user-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import { upload } from '@/middleware/upload';

const router = Router();

const emailSchema = z
  .string()
  .trim()
  .max(254, 'Email is too long')
  .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email address',
  })
  .optional()
  .or(z.literal(''))
  .or(z.null());

const upsertUserSchema = z.object({
  walletAddress: z.string().min(10),
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  email: emailSchema,
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  email: emailSchema,
});

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, validateBody(updateUserSchema), updateMyProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadAvatar);
router.get('/public/:walletAddress', getPublicProfile);
router.get('/:walletAddress', getUserByWallet);
router.post('/', validateBody(upsertUserSchema), upsertUser);
router.put('/:walletAddress', validateBody(updateUserSchema), updateUser);

export default router;
