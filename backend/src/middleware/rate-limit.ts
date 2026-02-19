import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// IPv6-compatible key generator
const walletKey = (req: Request) => {
  const wallet = typeof req.body?.walletAddress === 'string' ? req.body.walletAddress : 'unknown';
  // Use the default IP handling from express-rate-limit which properly handles IPv6
  const ip = req.ip || 'unknown';
  return `${ip}:${wallet}`;
};

// Detect development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// General API rate limiter: More lenient in development
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 in dev, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (isDevelopment) {
      const ip = req.ip || '';
      return ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost');
    }
    return false;
  },
});

// Strict rate limiter for authentication: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // More lenient in development
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  keyGenerator: (req) => walletKey(req),
});

// Rate limiter for nonce requests: 10 per 5 minutes
export const nonceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopment ? 100 : 10, // More lenient in development
  message: 'Too many nonce requests, please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => walletKey(req),
});
