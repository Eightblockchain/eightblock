import type { Request, Response } from 'express';
import { revokeToken, revokeUserTokens } from '../utils/token-revocation.js';
import { verifyToken } from '../utils/jwt.js';
import { CSRF_COOKIE_NAME, csrfCookieOptions } from '../utils/csrf.js';

const csrfRemovalOptions = { ...csrfCookieOptions };
delete csrfRemovalOptions.maxAge;

/**
 * Logout endpoint - revokes the current auth token
 */
export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies.auth_token;

    if (token) {
      try {
        const decoded = verifyToken(token);
        // Generate a unique token ID from the payload
        const tokenId = `${decoded.userId}:${decoded.iat}`;
        await revokeToken(tokenId);
      } catch (_error) {
        // Invalid token, but still clear the cookie
      }
    }

    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie(CSRF_COOKIE_NAME, csrfRemovalOptions);

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Revoke all tokens for the current user (e.g., after password change or security compromise)
 */
export async function revokeAllSessions(req: Request, res: Response) {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    await revokeUserTokens(decoded.userId);

    // Clear the current cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie(CSRF_COOKIE_NAME, csrfRemovalOptions);

    return res.json({ message: 'All sessions revoked successfully' });
  } catch (error) {
    console.error('Session revocation error:', error);
    return res.status(500).json({ error: 'Session revocation failed' });
  }
}
