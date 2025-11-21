import { Router } from 'express';
import { z } from 'zod';
import { createArticle, deleteArticle, getArticle, listArticles, updateArticle } from '@/controllers/article-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router();

const articleSchema = z.object({
  title: z.string().min(4),
  slug: z.string().min(3),
  description: z.string().min(10),
  content: z.string().min(20),
  category: z.string().min(3),
  tagIds: z.array(z.string()).optional(),
  authorId: z.string().min(1),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED']).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
});

router.get('/', listArticles);
router.get('/:slug', getArticle);
router.post('/', requireAuth, validateBody(articleSchema), createArticle);
router.put('/:id', requireAuth, updateArticle);
router.delete('/:id', requireAuth, deleteArticle);

export default router;
