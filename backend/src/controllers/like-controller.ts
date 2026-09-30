import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { refreshScore } from '../utils/score.js';

/** A clap belongs to the signed-in user, or to this browser's visitor id. */
function ownerFilter(req: Request, articleId: string): Prisma.LikeWhereInput | null {
  const userId = req.user?.userId;
  const visitorId = req.visitorId;
  const owners: Prisma.LikeWhereInput[] = [];
  if (userId) owners.push({ userId });
  if (visitorId) owners.push({ visitorId });
  if (owners.length === 0) return null;
  return { articleId, OR: owners };
}

export async function upsertLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const where = ownerFilter(req, articleId);
  if (!where) return res.status(400).json({ error: 'Missing visitor id' });

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, status: true },
  });
  if (!article || article.status !== 'PUBLISHED') {
    return res.status(404).json({ error: 'Article not found' });
  }

  const existing = await prisma.like.findFirst({ where });
  if (existing) return res.json(existing);

  const userId = req.user?.userId;
  const like = await prisma.like.create({
    data: userId ? { articleId, userId } : { articleId, visitorId: req.visitorId },
  });

  // Recompute score and invalidate cache
  await refreshScore(articleId);

  return res.status(201).json(like);
}

export async function removeLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const where = ownerFilter(req, articleId);
  if (!where) return res.status(400).json({ error: 'Missing visitor id' });

  const { count } = await prisma.like.deleteMany({ where });

  if (count > 0) {
    // Recompute score and invalidate cache
    await refreshScore(articleId);
  }

  return res.status(204).send();
}

export async function checkUserLike(req: Request, res: Response) {
  const { articleId } = req.params;
  const where = ownerFilter(req, articleId);
  if (!where) return res.json({ liked: false });

  const like = await prisma.like.findFirst({ where, select: { id: true } });
  return res.json({ liked: !!like });
}
