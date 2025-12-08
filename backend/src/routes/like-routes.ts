import { Router } from 'express';
import { z } from 'zod';
import { removeLike, upsertLike, checkUserLike } from '@/controllers/like-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router({ mergeParams: true });

const likeSchema = z.object({ userId: z.string().min(1) });

router.get('/', checkUserLike);
router.post('/', requireAuth, validateBody(likeSchema.partial()), upsertLike);
router.delete('/', requireAuth, validateBody(likeSchema.partial()), removeLike);

export default router;
