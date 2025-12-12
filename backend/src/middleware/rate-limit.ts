import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const walletKey = (req: Request) => {
  const wallet = typeof req.body?.walletAddress === 'string' ? req.body.walletAddress : 'unknown';
  return `${req.ip}:${wallet}`;
};

// General API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  keyGenerator: walletKey,
});

// Rate limiter for nonce requests: 10 per 5 minutes
export const nonceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many nonce requests, please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: walletKey,
});
