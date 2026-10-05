import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { cacheDelPattern } from '../utils/redis.js';
import { topicSlug } from '../utils/topics.js';

const order = [{ position: 'asc' as const }, { name: 'asc' as const }];

/** Article lists embed categories, so cached pages are stale after any change. */
const invalidateArticles = () => cacheDelPattern('articles:page:*');

function conflict(error: unknown) {
  return (error as { code?: string }).code === 'P2002';
}

/** Every category with its published article count, for the blog and the editor. */
export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: order,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { articles: { where: { article: { status: 'PUBLISHED' } } } } },
      },
    });
    return res.json(
      categories.map(({ _count, ...category }) => ({ ...category, count: _count.articles }))
    );
  } catch (error) {
    logger.error(`listCategories: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to load categories' });
  }
}

/** Categories with their total article count (drafts included), for the admin editor. */
export async function listAllCategories(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: order,
      include: { _count: { select: { articles: true } } },
    });
    return res.json(
      categories.map(({ _count, ...category }) => ({ ...category, articleCount: _count.articles }))
    );
  } catch (error) {
    logger.error(`listAllCategories: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to load categories' });
  }
}

export async function createCategory(req: Request, res: Response) {
  const { name, description } = req.body as { name: string; description: string | null };
  const slug = topicSlug(name);
  if (!slug)
    return res.status(400).json({ error: 'Use at least one letter or number in the name' });

  try {
    const last = await prisma.category.aggregate({ _max: { position: true } });
    const category = await prisma.category.create({
      data: { name, slug, description, position: (last._max.position ?? -1) + 1 },
    });
    await invalidateArticles();
    return res.status(201).json({ ...category, articleCount: 0 });
  } catch (error) {
    if (conflict(error)) return res.status(409).json({ error: `${name} already exists` });
    logger.error(`createCategory: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to create the category' });
  }
}

/** Renaming changes the slug too, so links to the old category page stop matching. */
export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body as { name: string; description: string | null };
  const slug = topicSlug(name);
  if (!slug)
    return res.status(400).json({ error: 'Use at least one letter or number in the name' });

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, description },
      include: { _count: { select: { articles: true } } },
    });
    await invalidateArticles();
    const { _count, ...rest } = category;
    return res.json({ ...rest, articleCount: _count.articles });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2025') return res.status(404).json({ error: 'Category not found' });
    if (conflict(error)) return res.status(409).json({ error: `${name} already exists` });
    logger.error(`updateCategory: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update the category' });
  }
}

/** Articles keep their other categories; ones left without any show as uncategorized. */
export async function deleteCategory(req: Request, res: Response) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    await invalidateArticles();
    return res.status(204).send();
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    logger.error(`deleteCategory: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to delete the category' });
  }
}

/** The payload order becomes the display order. Ids not in the payload keep their position. */
export async function reorderCategories(req: Request, res: Response) {
  const { ids } = req.body as { ids: string[] };
  try {
    await prisma.$transaction(
      ids.map((id, position) => prisma.category.updateMany({ where: { id }, data: { position } }))
    );
    await invalidateArticles();
    return listAllCategories(req, res);
  } catch (error) {
    logger.error(`reorderCategories: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to reorder categories' });
  }
}
