import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { cache } from '../utils/cache.js';

export async function listTags(_req: Request, res: Response) {
  try {
    // Try cache first
    const cacheKey = cache.tagsKey();
    const cached = await cache.get<any[]>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Fetch from database with optimized fields
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    // Cache for 10 minutes
    await cache.set(cacheKey, tags, 600);

    return res.json(tags);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
}

export async function createTag(req: Request, res: Response) {
  try {
    const { name, slug } = req.body;
    const tag = await prisma.tag.create({
      data: { name, slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Invalidate tags cache
    await cache.delete(cache.tagsKey());

    return res.status(201).json(tag);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create tag' });
  }
}

export async function deleteTag(req: Request, res: Response) {
  try {
    const { tagId } = req.params;
    await prisma.tag.delete({ where: { id: tagId } });

    // Invalidate tags cache
    await cache.delete(cache.tagsKey());

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
}
