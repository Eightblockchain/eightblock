import crypto from 'crypto';
import type { CookieOptions } from 'express';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const isProduction = process.env.NODE_ENV === 'production';

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  sameSite: 'strict',
  secure: isProduction,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}
