import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });

  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Invalid token format' });

  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();

  const [, token] = header.split(' ');
  if (!token) return next();

  try {
    req.user = verifyToken(token);
  } catch (error) {
    // ignore invalid token for optional auth
  }
  return next();
}
