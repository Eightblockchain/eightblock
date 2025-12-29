import type { Request, Response, NextFunction } from 'express';
import { getAllowedOrigins } from '../config/origins.js';

const trustedOrigins = new Set(getAllowedOrigins());
const allowOriginless = process.env.ALLOW_ORIGINLESS_WALLET === 'true';

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  const rawOrigin = req.headers.origin || req.headers.referer;
  const normalizedOrigin = normalizeOrigin(rawOrigin);

  if (!normalizedOrigin) {
    if (allowOriginless) {
      return next();
    }
    return res.status(400).json({ error: 'Origin header is required' });
  }

  if (!trustedOrigins.has(normalizedOrigin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  return next();
}

function normalizeOrigin(value?: string | string[]): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch (_error) {
    return null;
  }
}
