import { Router } from 'express';
import { removeLike, upsertLike, checkUserLike } from '@/controllers/like-controller';
import { requireAuth, optionalAuth } from '@/middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', optionalAuth, checkUserLike);
router.post('/', requireAuth, upsertLike);
router.delete('/', requireAuth, removeLike);

export default router;
