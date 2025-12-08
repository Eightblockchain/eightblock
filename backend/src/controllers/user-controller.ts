import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { logger } from '@/utils/logger';

/**
 * Get user by wallet address
 */
export async function getUserByWallet(req: Request, res: Response) {
  const { walletAddress } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        _count: {
          select: {
            articles: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    logger.error(`getUserByWallet: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Create or update user (upsert)
 */
export async function upsertUser(req: Request, res: Response) {
  const { walletAddress, name, bio, avatarUrl } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      create: {
        walletAddress,
        name: name || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
      include: {
        _count: {
          select: {
            articles: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    return res.json(user);
  } catch (error) {
    logger.error(`upsertUser: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to create/update user' });
  }
}

/**
 * Update user profile
 */
export async function updateUser(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const { name, bio, avatarUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        _count: {
          select: {
            articles: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    return res.json(user);
  } catch (error) {
    logger.error(`updateUser: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}
