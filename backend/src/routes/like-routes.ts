import { createRouter } from '../utils/async-router.js';
import { removeLike, upsertLike, checkUserLike } from '../controllers/like-controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { ensureVisitorId } from '../middleware/visitor.js';
import { clapLimiter } from '../middleware/rate-limit.js';

const router = createRouter({ mergeParams: true });

router.use(optionalAuth, ensureVisitorId);

router.get('/', checkUserLike);
router.post('/', clapLimiter, upsertLike);
router.delete('/', clapLimiter, removeLike);

export default router;
