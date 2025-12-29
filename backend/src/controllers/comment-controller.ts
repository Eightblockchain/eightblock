import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { cacheDelPattern } from '../utils/redis.js';

export async function listComments(req: Request, res: Response) {
  const { articleId } = req.params;
  const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const cursorParam = Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor;
  const limitStr = typeof limitParam === 'string' ? limitParam : '5';
  const limit = Math.min(Math.max(parseInt(limitStr, 10) || 5, 1), 20);
  const cursor = typeof cursorParam === 'string' ? cursorParam : undefined;

  const [commentResults, totalCount] = await Promise.all([
    prisma.comment.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : undefined,
      cursor: cursor ? { id: cursor } : undefined,
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
    }),
    prisma.comment.count({ where: { articleId } }),
  ]);

  let nextCursor: string | null = null;
  let comments = commentResults;

  if (comments.length > limit) {
    comments = comments.slice(0, limit);
    nextCursor = comments[comments.length - 1]?.id ?? null;
  }

  return res.json({ comments, nextCursor, totalCount });
}

export async function createComment(req: Request, res: Response) {
  const { articleId } = req.params;
  const { body } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const comment = await prisma.comment.create({
    data: { body, articleId, authorId: userId },
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

  // Invalidate article list cache for real-time updates
  await cacheDelPattern('articles:page:*');

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

    // Invalidate article list cache for real-time updates
    await cacheDelPattern('articles:page:*');

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
