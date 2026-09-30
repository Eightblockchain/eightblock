import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import { createTag, deleteTag, listTags } from '../controllers/tag-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireModerator, requireRole } from '../middleware/require-admin.js';

const router = createRouter();

const bodySchema = z.object({
  name: z.string().trim().min(2).max(50),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
});

router.get('/', listTags);
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'EDITOR', 'WRITER'),
  validateBody(bodySchema),
  createTag
);
router.delete('/:tagId', requireAuth, requireModerator, deleteTag);

export default router;
