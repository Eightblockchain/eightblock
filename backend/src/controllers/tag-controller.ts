import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';

export async function listTags(_req: Request, res: Response) {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  return res.json(tags);
}

export async function createTag(req: Request, res: Response) {
  const { name, slug } = req.body;
  const tag = await prisma.tag.create({ data: { name, slug } });
  return res.status(201).json(tag);
}

export async function deleteTag(req: Request, res: Response) {
  const { tagId } = req.params;
  await prisma.tag.delete({ where: { id: tagId } });
  return res.status(204).send();
}
