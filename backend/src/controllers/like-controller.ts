import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';

export async function upsertLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const { userId } = req.body;
  const finalUserId = userId ?? req.user?.userId;
  if (!finalUserId) return res.status(401).json({ error: 'User required' });

  const like = await prisma.like.upsert({
    where: { articleId_userId: { articleId, userId: finalUserId } },
    update: {},
    create: { articleId, userId: finalUserId },
  });
  return res.json(like);
}

export async function removeLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const { userId } = req.body;
  const finalUserId = userId ?? req.user?.userId;
  if (!finalUserId) return res.status(401).json({ error: 'User required' });

  await prisma.like.delete({ where: { articleId_userId: { articleId, userId: finalUserId } } });
  return res.status(204).send();
}

export async function checkUserLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const { userId } = req.query;
  const finalUserId = (userId as string) ?? req.user?.userId;
  if (!finalUserId) return res.json({ liked: false });

  const like = await prisma.like.findUnique({
    where: { articleId_userId: { articleId, userId: finalUserId } },
  });
  return res.json({ liked: !!like });
}
