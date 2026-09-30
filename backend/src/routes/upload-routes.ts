import { createRouter } from '../utils/async-router.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';

const writersOnly = requireRole('ADMIN', 'EDITOR', 'WRITER');
import { articleUpload } from '../middleware/upload.js';
import { uploadArticleImage, deleteArticleImage } from '../controllers/upload-controller.js';

const router = createRouter();

// Upload article image
router.post(
  '/article-image',
  requireAuth,
  writersOnly,
  articleUpload.single('image'),
  uploadArticleImage
);

// Delete article image
router.delete('/article-image', requireAuth, writersOnly, deleteArticleImage);

export default router;
