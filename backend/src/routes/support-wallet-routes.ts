import { createRouter } from '../utils/async-router.js';
import { z } from 'zod';
import {
  listAllSupportWallets,
  listSupportWallets,
  replaceSupportWallets,
} from '../controllers/support-wallet-controller.js';
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

const walletSchema = z.object({
  id: z
    .string()
    .regex(/^[A-Za-z0-9-]{1,64}$/)
    .optional(),
  network: z.string().trim().min(1).max(40),
  currency: z.string().trim().min(1).max(12),
  // Printable ASCII covers bech32, base58 and hex addresses, and keeps markup out of the QR code.
  address: z
    .string()
    .trim()
    .min(8, 'Too short to be an address')
    .max(200)
    .regex(/^[\x21-\x7e]+$/, 'Must not contain spaces or special characters'),
  label: optionalText(80),
  note: optionalText(200),
  enabled: z.boolean().default(true),
});

const walletsSchema = z.object({ wallets: z.array(walletSchema).max(10) });

const adminOnly = [requireAuth, requireRole('ADMIN')];

router.get('/', listSupportWallets);
router.get('/manage', ...adminOnly, listAllSupportWallets);
router.put('/', ...adminOnly, validateBody(walletsSchema), replaceSupportWallets);

export default router;
