import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { articleUpload } from '../middleware/upload.js';
import { uploadArticleImage, deleteArticleImage } from '../controllers/upload-controller.js';

const router = Router();

// Upload article image
router.post('/article-image', requireAuth, articleUpload.single('image'), uploadArticleImage);

// Delete article image
router.delete('/article-image', requireAuth, deleteArticleImage);

export default router;
