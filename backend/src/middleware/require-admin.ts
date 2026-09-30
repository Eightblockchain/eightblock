import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../prisma/client.js';

/** Checks the role in the database, so promotions and demotions apply without re-login. */
export function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that' });
    }

    return next();
  };
}

/** Admins and editors: comment moderation and similar upkeep on the site. */
export const requireModerator = requireRole('ADMIN', 'EDITOR');
