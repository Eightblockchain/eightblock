import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import {
  listBookmarks,
  listBookmarkIds,
  addBookmark,
  removeBookmark,
} from '@/controllers/bookmark-controller';

const router = Router();

router.use(requireAuth);
router.get('/', listBookmarks);
router.get('/ids', listBookmarkIds);
router.post('/', addBookmark);
router.delete('/:articleId', removeBookmark);

export default router;
