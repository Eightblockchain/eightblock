import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  moderateComment,
} from '../controllers/comment-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireModerator } from '../middleware/require-admin.js';
import { commentLimiter } from '../middleware/rate-limit.js';

const router = createRouter({ mergeParams: true });

const createSchema = z.object({
  body: z.string().trim().min(3).max(5000),
});

const updateSchema = z.object({
  body: z.string().trim().min(3).max(5000),
});

const moderateSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) });

router.get('/', listComments);
router.post('/', requireAuth, commentLimiter, validateBody(createSchema), createComment);
router.put('/:commentId', requireAuth, validateBody(updateSchema), updateComment);
router.delete('/:commentId', requireAuth, deleteComment);
router.patch(
  '/:commentId/moderate',
  requireAuth,
  requireModerator,
  validateBody(moderateSchema),
  moderateComment
);

export default router;
