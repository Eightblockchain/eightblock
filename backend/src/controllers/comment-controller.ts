import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';

export async function listComments(req: Request, res: Response) {
  const { articleId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { articleId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          walletAddress: true,
          avatarUrl: true,
        },
      },
    },
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
    include: {
      author: {
        select: {
          id: true,
          name: true,
          walletAddress: true,
          avatarUrl: true,
        },
      },
    },
  });
  return res.status(201).json(comment);
}

export async function updateComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const { body } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({ error: 'You can only update your own comments' });
    }

    // Update comment
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { body },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({ error: 'Failed to update comment' });
  }
}

export async function deleteComment(req: Request, res: Response) {
  const { commentId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
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
