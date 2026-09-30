import { createRouter } from '../utils/async-router.js';
import { resendWebhook } from '../controllers/webhook-controller.js';

const router = createRouter();

router.post('/resend', resendWebhook);

export default router;
