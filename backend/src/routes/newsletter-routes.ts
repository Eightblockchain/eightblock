import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  sendTest,
  previewCampaign,
  listArticles,
  getStatus,
  getSettings,
  updateSettings,
  previewDigest,
  runDigest,
} from '../controllers/newsletter-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';
import { settingsSchema } from '../services/newsletter-settings.js';

const router = createRouter();

const campaignSchema = z
  .object({
    subject: z.string().trim().min(1, 'Add a subject').max(200),
    preheader: z.string().trim().max(200).nullish(),
    htmlContent: z.string().max(200_000).default(''),
    articleIds: z.array(z.string().min(1)).max(10).default([]),
  })
  .refine((c) => c.htmlContent.replace(/<[^>]+>/g, '').trim() || c.articleIds.length > 0, {
    message: 'Write a message or feature at least one article',
  });

// The newsletter lives in the admin app, which only admins can use.
router.use(requireAuth, requireRole('ADMIN'));

router.get('/status', getStatus);
router.get('/settings', getSettings);
router.put('/settings', validateBody(settingsSchema), updateSettings);
router.get('/digest/preview', previewDigest);
router.post('/digest/run', runDigest);
router.get('/articles', listArticles);
router.post('/preview', validateBody(campaignSchema), previewCampaign);
router.post('/test', validateBody(campaignSchema), sendTest);
router.get('/', listCampaigns);
router.post('/', validateBody(campaignSchema), createCampaign);
router.get('/:id', getCampaign);
router.put('/:id', validateBody(campaignSchema), updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/send', sendCampaign);

export default router;
