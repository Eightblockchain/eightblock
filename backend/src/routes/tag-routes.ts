import { Router } from 'express';
import { z } from 'zod';
import { createTag, deleteTag, listTags } from '../controllers/tag-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const bodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

router.get('/', listTags);
router.post('/', requireAuth, validateBody(bodySchema), createTag);
router.delete('/:tagId', requireAuth, deleteTag);

export default router;
