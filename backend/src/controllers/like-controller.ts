import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { cacheDelPattern } from '@/utils/redis';

export async function upsertLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const like = await prisma.like.upsert({
    where: { articleId_userId: { articleId, userId } },
    update: {},
    create: { articleId, userId },
  });

  // Invalidate article list cache for real-time updates
  await cacheDelPattern('articles:page:*');

  return res.json(like);
}

export async function removeLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  await prisma.like.delete({ where: { articleId_userId: { articleId, userId } } });

  // Invalidate article list cache for real-time updates
  await cacheDelPattern('articles:page:*');

  return res.status(204).send();
}

export async function checkUserLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const userId = req.user?.userId;
  if (!userId) return res.json({ liked: false });

  const like = await prisma.like.findUnique({
    where: { articleId_userId: { articleId, userId } },
  });
  return res.json({ liked: !!like });
}
