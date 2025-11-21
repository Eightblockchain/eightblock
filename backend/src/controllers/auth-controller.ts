import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/prisma/client';
import { signToken } from '@/utils/jwt';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name } });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (_error) {
    return res.status(400).json({ error: 'Unable to register' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ userId: user.id, role: user.role });
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}
