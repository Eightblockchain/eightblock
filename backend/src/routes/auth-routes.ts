import { Router } from 'express';
import { z } from 'zod';
import { walletAuth, requestNonce } from '../controllers/auth-controller.js';
import { logout, revokeAllSessions } from '../controllers/logout-controller.js';
import { validateBody } from '../middleware/validate.js';
import { authLimiter, nonceLimiter } from '../middleware/rate-limit.js';
import { requireTrustedOrigin } from '../middleware/origin-check.js';

const router = Router();

const requestNonceSchema = z.object({
  walletAddress: z
    .string()
    .min(10)
    .refine((addr) => addr.startsWith('addr1'), {
      message: 'Must be a valid Cardano address starting with addr1',
    }),
});

const walletAuthSchema = z.object({
  walletAddress: z
    .string()
    .min(10)
    .refine((addr) => addr.startsWith('addr1'), {
      message: 'Must be a valid Cardano address starting with addr1',
    }),
  nonce: z.string().min(1, 'Nonce is required'),
  signature: z.string().min(1, 'Signature is required'),
  key: z.string().min(1, 'Public key is required'),
});

// Step 1: Request authentication nonce (rate limited)
router.post(
  '/wallet/nonce',
  requireTrustedOrigin,
  nonceLimiter,
  validateBody(requestNonceSchema),
  requestNonce
);

// Step 2: Authenticate with signature (strict rate limiting)
router.post(
  '/wallet',
  requireTrustedOrigin,
  authLimiter,
  validateBody(walletAuthSchema),
  walletAuth
);

// Logout endpoint - revoke current session
router.post('/logout', logout);

// Revoke all sessions for current user
router.post('/revoke-all', revokeAllSessions);

export default router;
