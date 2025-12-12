import type { Request, Response, NextFunction } from 'express';
import { getAllowedOrigins } from '@/config/origins';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  csrfCookieOptions,
  generateCsrfToken,
} from '@/utils/csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = ['/api/auth/wallet', '/api/auth/wallet/nonce'];
const allowedOriginSet = new Set(getAllowedOrigins());

function extractOriginFromReferer(referer?: string | null) {
  if (!referer) {
    return null;
  }

  try {
    const parsed = new URL(referer);
    return parsed.origin;
  } catch (_error) {
    return null;
  }
}

function hasTrustedOrigin(req: Request) {
  const originHeader = req.get('origin') || extractOriginFromReferer(req.get('referer'));
  if (!originHeader) {
    return false;
  }

  return allowedOriginSet.has(originHeader);
}

export function ensureCsrfCookie(_req: Request, res: Response, next: NextFunction) {
  if (!_req.cookies[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), csrfCookieOptions);
  }
  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const shouldSkip = CSRF_EXEMPT_PATHS.some((path) => req.originalUrl.startsWith(path));
  if (shouldSkip) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (cookieToken && headerToken && cookieToken === headerToken) {
    return next();
  }

  // Fallback to strict Origin/Referer validation for clients that cannot attach the CSRF header
  if (!req.get('origin') && !req.get('referer')) {
    return next();
  }

  if (hasTrustedOrigin(req)) {
    return next();
  }

  return res.status(403).json({ error: 'CSRF validation failed' });
}
