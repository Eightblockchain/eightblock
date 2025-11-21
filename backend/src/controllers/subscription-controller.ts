import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';

export async function createSubscription(req: Request, res: Response) {
  const { email, topics } = req.body;
  const subscription = await prisma.subscription.upsert({
    where: { email },
    update: { topics },
    create: { email, topics },
  });
  return res.status(201).json(subscription);
}

export async function listSubscriptions(_req: Request, res: Response) {
  const rows = await prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(rows);
}
