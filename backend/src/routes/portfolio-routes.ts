import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import { getPortfolio, updatePortfolio } from '../controllers/portfolio-controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';

const router = createRouter();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === '' || /^https?:\/\//i.test(value),
    'Must start with http:// or https://'
  )
  .optional()
  .transform((value) => value || undefined);

const portfolioSchema = z.object({
  headline: optionalText(160),
  intro: optionalText(600),
  story: optionalText(8000),
  location: optionalText(80),
  focusAreas: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  projects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300).default(''),
        url: optionalUrl,
      })
    )
    .max(12)
    .default([]),
  links: z
    .object({
      website: optionalUrl,
      github: optionalUrl,
      twitter: optionalUrl,
      linkedin: optionalUrl,
      email: z
        .string()
        .trim()
        .max(160)
        .refine(
          (value) => value === '' || z.string().email().safeParse(value).success,
          'Invalid email'
        )
        .optional()
        .transform((value) => value || undefined),
    })
    .default({}),
});

router.get('/', getPortfolio);
router.put('/', requireAuth, requireRole('ADMIN'), validateBody(portfolioSchema), updatePortfolio);

export default router;
