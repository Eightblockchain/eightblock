import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  createCategory,
  deleteCategory,
  listAllCategories,
  listCategories,
  reorderCategories,
  updateCategory,
} from '../controllers/category-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';

const router = createRouter();

const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  description: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((value) => value || null),
});

const orderSchema = z.object({ ids: z.array(z.string().min(1).max(64)).max(100) });

const adminOnly = [requireAuth, requireRole('ADMIN')];

router.get('/', listCategories);
router.get('/manage', ...adminOnly, listAllCategories);
router.post('/', ...adminOnly, validateBody(categorySchema), createCategory);
router.put('/order', ...adminOnly, validateBody(orderSchema), reorderCategories);
router.put('/:id', ...adminOnly, validateBody(categorySchema), updateCategory);
router.delete('/:id', ...adminOnly, deleteCategory);

export default router;
