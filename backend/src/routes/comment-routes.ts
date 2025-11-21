import { Router } from 'express';
import { z } from 'zod';
import { createComment, listComments, moderateComment } from '@/controllers/comment-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router({ mergeParams: true });

const createSchema = z.object({
  body: z.string().min(3),
  authorId: z.string().min(1),
});

const moderateSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) });

router.get('/', listComments);
router.post('/', validateBody(createSchema), createComment);
router.patch('/:commentId', requireAuth, validateBody(moderateSchema), moderateComment);

export default router;
