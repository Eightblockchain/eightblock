import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export const VISITOR_COOKIE = 'eb_vid';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Gives every browser a stable anonymous id so readers can clap without an account. */
export function ensureVisitorId(req: Request, res: Response, next: NextFunction) {
  const existing = req.cookies[VISITOR_COOKIE];

  if (typeof existing === 'string' && UUID_RE.test(existing)) {
    req.visitorId = existing;
    return next();
  }

  const visitorId = crypto.randomUUID();
  res.cookie(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  req.visitorId = visitorId;
  return next();
}
