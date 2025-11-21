import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { logger } from '@/utils/logger';

export async function listArticles(_req: Request, res: Response) {
  const articles = await prisma.article.findMany({
    include: {
      tags: { include: { tag: true } },
      author: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { publishedAt: 'desc' },
  });
  return res.json(articles);
}

export async function getArticle(req: Request, res: Response) {
  const { slug } = req.params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } }, comments: true, author: true },
  });
  if (!article) return res.status(404).json({ error: 'Article not found' });
  return res.json(article);
}

export async function createArticle(req: Request, res: Response) {
  const {
    title,
    slug,
    description,
    content,
    category,
    tagIds = [],
    authorId,
    status,
    featured,
    publishedAt,
  } = req.body;
  try {
    const created = await prisma.article.create({
      data: {
        title,
        slug,
        description,
        content,
        category,
        authorId,
        status,
        featured,
        publishedAt,
        tags: {
          create: tagIds.map((tagId: string) => ({ tagId })),
        },
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    logger.error(`createArticle: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to create article' });
  }
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const { tagIds, ...rest } = req.body;
  try {
    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...rest,
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId: string) => ({ tagId })),
              },
            }
          : {}),
      },
    });
    return res.json(updated);
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to update article' });
  }
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.article.delete({ where: { id } });
    return res.status(204).send();
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to delete article' });
  }
}
