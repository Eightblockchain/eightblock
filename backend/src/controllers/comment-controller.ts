import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';

export async function listComments(req: Request, res: Response) {
  const { articleId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { articleId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(comments);
}

export async function createComment(req: Request, res: Response) {
  const { articleId } = req.params;
  const { body, authorId } = req.body;
  const finalAuthorId = authorId ?? req.user?.userId;
  if (!finalAuthorId) return res.status(401).json({ error: 'Author required' });
  const comment = await prisma.comment.create({
    data: { body, articleId, authorId: finalAuthorId },
  });
  return res.status(201).json(comment);
}

export async function moderateComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const { status } = req.body;
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
  });
  return res.json(updated);
}
