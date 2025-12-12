import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { isTokenRevoked, isTokenRevokedForUser } from '@/utils/token-revocation';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Read token from httpOnly cookie instead of Authorization header
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);

    // Check if token has been explicitly revoked
    const tokenId = `${decoded.userId}:${decoded.iat}`;
    const revoked = await isTokenRevoked(tokenId);
    if (revoked) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Check if all user tokens have been revoked
    const userRevoked = await isTokenRevokedForUser(decoded.userId, decoded.iat || 0);
    if (userRevoked) {
      return res.status(401).json({ error: 'Session expired' });
    }

    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies.auth_token;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);

    // Check token revocation for optional auth too
    const tokenId = `${decoded.userId}:${decoded.iat}`;
    const revoked = await isTokenRevoked(tokenId);
    if (!revoked) {
      const userRevoked = await isTokenRevokedForUser(decoded.userId, decoded.iat || 0);
      if (!userRevoked) {
        req.user = decoded;
      }
    }
  } catch (_error) {
    // Ignore invalid token for optional auth
  }

  return next();
}
