import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { logger } from '@/utils/logger';

const BOOKMARK_ARTICLE_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  content: true,
  category: true,
  featuredImage: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  uniqueViews: true,
  tags: { include: { tag: true } },
  author: {
    select: {
      id: true,
      walletAddress: true,
      name: true,
      avatarUrl: true,
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
};

export async function listBookmarks(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          select: BOOKMARK_ARTICLE_SELECT,
        },
      },
    });

    return res.json({
      bookmarks: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        createdAt: bookmark.createdAt,
        article: bookmark.article,
      })),
    });
  } catch (error) {
    logger.error(`listBookmarks: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
}

export async function listBookmarkIds(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { articleId: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ articleIds: bookmarks.map((bookmark) => bookmark.articleId) });
  } catch (error) {
    logger.error(`listBookmarkIds: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch bookmark ids' });
  }
}

export async function addBookmark(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { articleId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!articleId) {
    return res.status(400).json({ error: 'Article ID is required' });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article || article.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Article not found or not published' });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: {},
      create: { userId, articleId },
      include: {
        article: {
          select: BOOKMARK_ARTICLE_SELECT,
        },
      },
    });

    return res.status(201).json({
      bookmark: {
        id: bookmark.id,
        createdAt: bookmark.createdAt,
        article: bookmark.article,
      },
    });
  } catch (error) {
    logger.error(`addBookmark: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to add bookmark' });
  }
}

export async function removeBookmark(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { articleId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!articleId) {
    return res.status(400).json({ error: 'Article ID is required' });
  }

  try {
    await prisma.bookmark.delete({
      where: { userId_articleId: { userId, articleId } },
    });

    return res.status(204).send();
  } catch (error) {
    logger.error(`removeBookmark: ${(error as Error).message}`);
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    return res.status(500).json({ error: 'Failed to remove bookmark' });
  }
}
