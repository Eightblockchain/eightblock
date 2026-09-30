import type { Request, Response } from 'express';
import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';
import { isConfiguredAdmin } from '../config/admins.js';
import { generateUsername, isReservedUsername } from '../utils/username.js';
import { optimizeImage, deleteImage, getExtensionForFormat } from '../utils/image-optimizer.js';
import path from 'path';
import fs from 'fs';
import { getFullImageUrl } from '../utils/imgUrl.js';

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

    const userResponse = {
      ...user,
      avatarUrl: getFullImageUrl(user.avatarUrl || ''),
    };

    return res.json(userResponse);
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
  const { name, bio, avatar, username } = req.body as {
    name?: string;
    bio?: string;
    avatar?: 'google' | 'none';
    username?: string;
  };

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, googleAvatarUrl: true, username: true },
    });
    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username !== undefined && username !== current.username) {
      if (isReservedUsername(username)) {
        return res.status(400).json({ error: 'That username is reserved. Pick another one.' });
      }
      const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
      if (taken) {
        return res.status(409).json({ error: 'That username is taken. Pick another one.' });
      }
    }

    let avatarUrl: string | null | undefined;
    if (avatar === 'google') avatarUrl = current.googleAvatarUrl;
    if (avatar === 'none') avatarUrl = null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
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

    if (avatarUrl !== undefined && current.avatarUrl?.startsWith('/uploads/avatars/')) {
      deleteImage(path.join(process.cwd(), current.avatarUrl.replace(/^\//, '')));
    }

    const userResponse = {
      ...user,
      avatarUrl: getFullImageUrl(user.avatarUrl || ''),
    };

    return res.json(userResponse);
  } catch (error) {
    // Two people claiming the same free username at the same moment.
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'That username is taken. Pick another one.' });
    }
    logger.error(`updateMyProfile: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'WRITER', 'READER'];

const adminUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
  _count: { select: { articles: true } },
} satisfies Prisma.UserSelect;

/**
 * List users for role management (admins only).
 * Query: q (name or email), role, page, limit (max 50).
 */
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const role = ROLES.find((r) => r === req.query.role);

  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  try {
    const [users, total, byRole] = await Promise.all([
      prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    const counts = { ALL: 0, ADMIN: 0, EDITOR: 0, WRITER: 0, READER: 0 };
    for (const row of byRole) {
      counts[row.role] = row._count;
      counts.ALL += row._count;
    }

    return res.json({
      users: users.map((user) => ({
        ...user,
        avatarUrl: user.avatarUrl ? getFullImageUrl(user.avatarUrl) : null,
        managedByConfig: isConfiguredAdmin(user.email),
      })),
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    logger.error(`listUsers: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Change a user's role (admins only). Takes effect on the user's next request,
 * because permissions are checked against the database.
 */
export async function updateUserRole(req: Request, res: Response) {
  const actorId = req.user?.userId;
  const { id } = req.params;
  const { role } = req.body as { role: Role };

  if (id === actorId) {
    return res.status(400).json({ error: 'You cannot change your own role. Ask another admin.' });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true, name: true, username: true },
    });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role !== 'ADMIN' && isConfiguredAdmin(target.email)) {
      return res.status(409).json({
        error:
          'This account is listed in ADMIN_EMAILS and becomes admin again at every sign-in. Remove it there first.',
      });
    }

    // Writers need a handle for their public author page.
    const username =
      target.username ??
      (role !== 'READER' ? await generateUsername(target.name, target.email) : undefined);
    const user = await prisma.user.update({
      where: { id },
      data: { role, ...(username && { username }) },
      select: adminUserSelect,
    });
    logger.info(`Role of user ${id} changed from ${target.role} to ${role} by ${actorId}`);

    return res.json({
      ...user,
      avatarUrl: user.avatarUrl ? getFullImageUrl(user.avatarUrl) : null,
      managedByConfig: isConfiguredAdmin(user.email),
    });
  } catch (error) {
    logger.error(`updateUserRole: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to update role' });
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

    const userResponse = {
      ...updatedUser,
      avatarUrl: getFullImageUrl(updatedUser.avatarUrl || ''),
    };

    return res.json({
      user: userResponse,
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
