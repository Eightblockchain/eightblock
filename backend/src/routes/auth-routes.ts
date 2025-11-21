import { Router } from 'express';
import { z } from 'zod';
import { login, register } from '@/controllers/auth-controller';
import { validateBody } from '@/middleware/validate';

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', validateBody(authSchema.extend({ name: z.string().min(2).optional() })), register);
router.post('/login', validateBody(authSchema), login);

export default router;
