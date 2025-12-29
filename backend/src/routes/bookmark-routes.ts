import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listBookmarks,
  listBookmarkIds,
  addBookmark,
  removeBookmark,
} from '../controllers/bookmark-controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listBookmarks);
router.get('/ids', listBookmarkIds);
router.post('/', addBookmark);
router.delete('/:articleId', removeBookmark);

export default router;
