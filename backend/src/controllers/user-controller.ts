import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { cache } from '../utils/cache.js';
import { optimizeImage, deleteImage, getExtensionForFormat } from '../utils/image-optimizer.js';
import path from 'path';
import fs from 'fs';

function normalizeEmailInput(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed.toLowerCase();
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(req: Request, res: Response) {
  const { walletAddress } = req.params;

  try {
    // Try cache first
    const cacheKey = cache.userProfileKey(walletAddress);
    const cached = await cache.get<any>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        name: true,
        bio: true,
        avatarUrl: true,
        email: true,
        createdAt: true,
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

    // Cache for 5 minutes
    await cache.set(cacheKey, user, 300);

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
  const { walletAddress, name, bio, avatarUrl, email } = req.body;
  const normalizedEmail = normalizeEmailInput(email);

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
        ...(normalizedEmail !== undefined && { email: normalizedEmail }),
      },
      create: {
        walletAddress,
        name: name || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        email: normalizedEmail ?? null,
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
  const { name, bio, avatarUrl, email } = req.body;
  const normalizedEmail = normalizeEmailInput(email);

  try {
    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(normalizedEmail !== undefined && { email: normalizedEmail }),
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

/**
 * Get current user's profile
 */
export async function getMyProfile(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    logger.error(`getMyProfile: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { name, bio, avatarUrl, email } = req.body;
  const normalizedEmail = normalizeEmailInput(email);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(normalizedEmail !== undefined && { email: normalizedEmail }),
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
    logger.error(`updateMyProfile: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * Upload and update user avatar
 */
export async function uploadAvatar(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Get current user to delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // Optimize the uploaded image
    const uploadedPath = req.file.path;
    const fileName = path.basename(uploadedPath, path.extname(uploadedPath));
    const outputPath = path.join(
      path.dirname(uploadedPath),
      `${fileName}${getExtensionForFormat('webp')}`
    );

    const optimizedImage = await optimizeImage(uploadedPath, outputPath, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp',
    });

    // Generate avatar URL (relative path from backend)
    const avatarUrl = `/uploads/avatars/${path.basename(optimizedImage.path)}`;

    // Update user profile with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
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

    // Delete old avatar file if it exists
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(process.cwd(), currentUser.avatarUrl.replace(/^\//, ''));
      deleteImage(oldFilePath);
    }

    logger.info(`Avatar uploaded for user ${userId}: ${avatarUrl}`);

    return res.json({
      user: updatedUser,
      avatar: {
        url: avatarUrl,
        size: optimizedImage.size,
        width: optimizedImage.width,
        height: optimizedImage.height,
      },
    });
  } catch (error) {
    logger.error(`uploadAvatar: ${(error as Error).message}`);
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
}

/**
 * Public profile for sharing (published articles only, no sensitive fields)
 */
export async function getPublicProfile(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 6, 1), 24);
  const skip = (page - 1) * limit;

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const articleWhere = {
      authorId: user.id,
      status: 'PUBLISHED' as const,
    };

    const [articles, totalPublished, aggregateStats, likesCount] = await Promise.all([
      prisma.article.findMany({
        where: articleWhere,
        select: {
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
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where: articleWhere }),
      prisma.article.aggregate({
        where: articleWhere,
        _sum: {
          viewCount: true,
          uniqueViews: true,
        },
      }),
      prisma.like.count({
        where: {
          article: {
            authorId: user.id,
            status: 'PUBLISHED',
          },
        },
      }),
    ]);

    return res.json({
      profile: {
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        joinedAt: user.createdAt,
        stats: {
          articles: totalPublished,
          views: aggregateStats._sum.viewCount ?? 0,
          uniqueViews: aggregateStats._sum.uniqueViews ?? 0,
          likes: likesCount,
        },
      },
      articles,
      pagination: {
        page,
        limit,
        total: totalPublished,
        totalPages: Math.max(Math.ceil(totalPublished / limit), 1),
        hasMore: page * limit < totalPublished,
      },
    });
  } catch (error) {
    logger.error(`getPublicProfile: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch public profile' });
  }
}
