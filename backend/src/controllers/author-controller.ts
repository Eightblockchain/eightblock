import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { getFullImageUrl } from '../utils/imgUrl.js';

/**
 * Public profile of a writer, looked up by username.
 * Readers who never published have no public page.
 */
export async function getAuthor(req: Request, res: Response) {
  const username = req.params.username.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { articles: { where: { status: 'PUBLISHED' } } } },
      },
    });

    if (!user || (user.role === 'READER' && user._count.articles === 0)) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const latest = await prisma.article.findFirst({
      where: { authorId: user.id, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { publishedAt: true },
    });

    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl ? getFullImageUrl(user.avatarUrl) : null,
      joinedAt: user.createdAt,
      articleCount: user._count.articles,
      lastPublishedAt: latest?.publishedAt ?? null,
    });
  } catch (error) {
    logger.error(`getAuthor: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch author' });
  }
}
