import { createRouter } from '../utils/async-router.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listBookmarks,
  listBookmarkIds,
  addBookmark,
  removeBookmark,
} from '../controllers/bookmark-controller.js';

const router = createRouter();

router.use(requireAuth);
router.get('/', listBookmarks);
router.get('/ids', listBookmarkIds);
router.post('/', addBookmark);
router.delete('/:articleId', removeBookmark);

export default router;
