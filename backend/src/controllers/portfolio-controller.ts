import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { getFullImageUrl } from '../utils/imgUrl.js';

const PROFILE_ID = 'site';

const profileInclude = {
  user: { select: { name: true, avatarUrl: true, bio: true } },
} as const;

type ProfileWithUser = Prisma.AuthorProfileGetPayload<{ include: typeof profileInclude }>;

function serialize(profile: ProfileWithUser) {
  const { user, userId: _userId, ...rest } = profile;
  return {
    ...rest,
    name: user.name,
    avatarUrl: user.avatarUrl ? getFullImageUrl(user.avatarUrl) : null,
  };
}

/** Public portfolio for the About page. Returns `null` until the author fills it in. */
export async function getPortfolio(_req: Request, res: Response) {
  try {
    const profile = await prisma.authorProfile.findUnique({
      where: { id: PROFILE_ID },
      include: profileInclude,
    });
    return res.json(profile ? serialize(profile) : null);
  } catch (error) {
    logger.error(`getPortfolio: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to load portfolio' });
  }
}

export async function updatePortfolio(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { headline, intro, story, location, focusAreas, projects, links } = req.body;
  const data = { headline, intro, story, location, focusAreas, projects, links };

  try {
    const profile = await prisma.authorProfile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, userId, ...data },
      update: { userId, ...data },
      include: profileInclude,
    });
    return res.json(serialize(profile));
  } catch (error) {
    logger.error(`updatePortfolio: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to save portfolio' });
  }
}
