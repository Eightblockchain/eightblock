import { z } from 'zod';
import { createRouter } from '../utils/async-router.js';
import {
  getTemplate,
  listTemplates,
  previewTemplateEmail,
  resetTemplate,
  sendTemplateTest,
  updateTemplate,
} from '../controllers/email-template-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';
import { COPY_FIELDS, FIELD_LIMITS } from '../services/email-copy.js';

const router = createRouter();

// Only a cap on request size: the controller checks each template's real limits and variables.
const copySchema = z.object({
  copy: z.object(
    Object.fromEntries(
      COPY_FIELDS.map((field) => [
        field,
        z
          .string()
          .max(FIELD_LIMITS[field] * 2)
          .nullish(),
      ])
    )
  ),
});

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listTemplates);
router.get('/:key', getTemplate);
router.put('/:key', validateBody(copySchema), updateTemplate);
router.delete('/:key', resetTemplate);
router.post('/:key/preview', validateBody(copySchema), previewTemplateEmail);
router.post('/:key/test', validateBody(copySchema), sendTemplateTest);

export default router;
