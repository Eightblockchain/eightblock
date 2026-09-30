import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  createArticle,
  deleteArticle,
  getArticle,
  listArticles,
  updateArticle,
  getMyArticles,
  getRelatedArticles,
  listTopics,
} from '../controllers/article-controller.js';
import { validateBody } from '../middleware/validate.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';

const router = createRouter();
const writers = requireRole('ADMIN', 'EDITOR', 'WRITER');

// These paths are taken by fixed pages and endpoints, so an article there could never be opened.
const RESERVED_SLUGS = new Set(['new', 'mine', 'topics']);

const articleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1, 'Add a title with at least one letter or number to generate the URL')
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use only lowercase letters, numbers and single hyphens')
    .refine(
      (slug) => !RESERVED_SLUGS.has(slug),
      'This URL is reserved. Add a word or two to the title'
    ),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).max(500_000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  featuredImage: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

router.get('/', listArticles);
router.get('/mine', requireAuth, getMyArticles);
router.get('/topics', listTopics);
router.get('/:slug/related', getRelatedArticles);
router.get('/:slug', optionalAuth, getArticle);
router.post('/', requireAuth, writers, validateBody(articleSchema), createArticle);
router.put('/:id', requireAuth, writers, validateBody(articleSchema.partial()), updateArticle);
// Authors keep the right to remove their own work even after losing the writer role.
router.delete('/:id', requireAuth, deleteArticle);

export default router;
