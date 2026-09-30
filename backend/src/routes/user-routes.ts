import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  getMyProfile,
  listUsers,
  updateMyProfile,
  updateUserRole,
  uploadAvatar,
} from '../controllers/user-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';
import { upload } from '../middleware/upload.js';
import { USERNAME_PATTERN } from '../utils/username.js';

const router = createRouter();

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.enum(['google', 'none']).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      USERNAME_PATTERN,
      'Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number'
    )
    .optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'WRITER', 'READER']),
});

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, validateBody(updateUserSchema), updateMyProfile);
router.post('/me/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

router.get('/', requireAuth, requireRole('ADMIN'), listUsers);
router.patch(
  '/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(updateRoleSchema),
  updateUserRole
);

export default router;
