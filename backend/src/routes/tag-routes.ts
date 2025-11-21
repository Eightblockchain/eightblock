import { Router } from 'express';
import { z } from 'zod';
import { createTag, deleteTag, listTags } from '@/controllers/tag-controller';
import { validateBody } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';

const router = Router();

const bodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

router.get('/', listTags);
router.post('/', requireAuth, validateBody(bodySchema), createTag);
router.delete('/:tagId', requireAuth, deleteTag);

export default router;
