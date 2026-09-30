import rateLimit, { type ClientRateLimitInfo, type Options, type Store } from 'express-rate-limit';
import type { Request } from 'express';
import { getRedisClient } from '../utils/redis.js';

// Detect development environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Keeps hit counters in Redis so every PM2 instance shares them; the default memory store gives
 * each instance its own count. Development and tests keep the memory store, which resets on
 * restart instead of carrying tight production limits across runs.
 */
class RedisStore implements Store {
  localKeys = false;
  private windowMs = 60_000;

  constructor(readonly prefix: string) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private client() {
    const client = getRedisClient();
    if (!client) throw new Error('Redis is unavailable');
    return client;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const id = this.prefix + key;
    // SET NX starts the window with its expiry in the same transaction as the first hit.
    const results = await this.client()
      .multi()
      .set(id, 0, 'PX', this.windowMs, 'NX')
      .incr(id)
      .pttl(id)
      .exec();
    if (!results || results.some(([error]) => error)) throw new Error('Rate limit update failed');
    const totalHits = Number(results[1][1]);
    const ttl = Math.max(Number(results[2][1]), 0);
    return { totalHits, resetTime: new Date(Date.now() + ttl) };
  }

  async decrement(key: string) {
    await this.client().decr(this.prefix + key);
  }

  async resetKey(key: string) {
    await this.client().del(this.prefix + key);
  }
}

const store = (name: string) =>
  process.env.NODE_ENV === 'production' ? { store: new RedisStore(`rl:${name}:`) } : {};

// Server-side rendering calls the API from the VPS itself, so its public IP must be listed in
// RATE_LIMIT_ALLOWLIST or every visitor's page render would share one bucket.
const allowlist = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  ...(process.env.RATE_LIMIT_ALLOWLIST ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
]);

const isAllowlisted = (req: Request) => allowlist.has(req.ip ?? '');

// A Redis outage already blocks sign-in; it should not also turn every request into a 500.
const shared = { standardHeaders: true, legacyHeaders: false, passOnStoreError: true } as const;

// General API rate limiter. A single article view fires several API calls, so keep headroom.
export const apiLimiter = rateLimit({
  ...shared,
  ...store('api'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 600,
  message: 'Too many requests from this IP, please try again later.',
  skip: isAllowlisted,
});

// Sign-in flow limiter: each Google round trip costs two requests (start + callback)
export const authLimiter = rateLimit({
  ...shared,
  ...store('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 30,
  message: 'Too many sign-in attempts, please try again later.',
});

// Claps are anonymous, so keep them cheap but bounded per IP
export const clapLimiter = rateLimit({
  ...shared,
  ...store('clap'),
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 300 : 30,
  message: 'Too many requests, please slow down.',
});

// Page views plus a heartbeat every half minute per open tab
export const analyticsLimiter = rateLimit({
  ...shared,
  ...store('analytics'),
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 120,
  message: { error: 'Too many analytics events.' },
  skip: isAllowlisted,
});

// Per account rather than per IP: commenting always needs a signed-in user.
export const commentLimiter = rateLimit({
  ...shared,
  ...store('comment'),
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDevelopment ? 200 : 10,
  message: { error: 'You are replying too fast, please wait a few minutes.' },
  keyGenerator: (req) => `user:${req.user?.userId}`,
});

// Every signup sends a confirmation email, so cap it tightly to stop inbox flooding
export const subscribeLimiter = rateLimit({
  ...shared,
  ...store('subscribe'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 5,
  message: { error: 'Too many signups from this network, please try again later.' },
});
