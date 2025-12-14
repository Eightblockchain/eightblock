import { Router } from 'express';
import { z } from 'zod';
import {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  moderateComment,
} from '@/controllers/comment-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router({ mergeParams: true });

const createSchema = z.object({
  body: z.string().min(3),
});

const updateSchema = z.object({
  body: z.string().min(3),
});

const moderateSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) });

router.get('/', listComments);
router.post('/', requireAuth, validateBody(createSchema), createComment);
router.put('/:commentId', requireAuth, validateBody(updateSchema), updateComment);
router.delete('/:commentId', requireAuth, deleteComment);
router.patch('/:commentId/moderate', requireAuth, validateBody(moderateSchema), moderateComment);

export default router;
