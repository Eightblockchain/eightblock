import { Router } from 'express';
import { z } from 'zod';
import {
  createArticle,
  deleteArticle,
  getArticle,
  listArticles,
  updateArticle,
  getArticlesByWallet,
  getRelatedArticles,
} from '../controllers/article-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const articleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

router.get('/', listArticles);
router.get('/wallet/:walletAddress', getArticlesByWallet);
router.get('/:slug', getArticle);
router.get('/:slug/related', getRelatedArticles);
router.post('/', requireAuth, validateBody(articleSchema), createArticle);
router.put('/:id', requireAuth, validateBody(articleSchema.partial()), updateArticle);
router.delete('/:id', requireAuth, deleteArticle);

export default router;
