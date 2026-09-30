import { createRouter } from '../utils/async-router.js';
import { authProviders, googleCallback, googleStart } from '../controllers/auth-controller.js';
import { logout, revokeAllSessions } from '../controllers/logout-controller.js';
import { authLimiter } from '../middleware/rate-limit.js';

const router = createRouter();

router.get('/providers', authProviders);

// Google OAuth (authorization code + PKCE)
router.get('/google', authLimiter, googleStart);
router.get('/google/callback', authLimiter, googleCallback);

// Logout endpoint - revoke current session
router.post('/logout', logout);

// Revoke all sessions for current user
router.post('/revoke-all', revokeAllSessions);

export default router;
