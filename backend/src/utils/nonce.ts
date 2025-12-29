import crypto from 'crypto';
import { getRedisClient } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

const NONCE_TTL_MS = 5 * 60 * 1000;
const REDIS_NONCE_PREFIX = 'wallet:nonce:';

// In-memory fallback store (used only when Redis is unavailable)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

// Clean up expired nonces every 5 minutes (fallback store only)
setInterval(() => {
  const now = Date.now();
  for (const [walletAddress, data] of nonceStore.entries()) {
    if (data.expiresAt < now) {
      nonceStore.delete(walletAddress);
    }
  }
}, NONCE_TTL_MS);

export async function generateNonce(walletAddress: string): Promise<string> {
  const nonce = crypto.randomBytes(32).toString('hex');
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis unavailable - authentication temporarily disabled');
  }

  try {
    await redis.setex(
      `${REDIS_NONCE_PREFIX}${walletAddress}`,
      Math.ceil(NONCE_TTL_MS / 1000),
      nonce
    );
    return nonce;
  } catch (error) {
    logger.error('Redis nonce set failed:', error);
    throw new Error('Authentication service temporarily unavailable');
  }
}

export async function verifyAndConsumeNonce(
  walletAddress: string,
  nonce: string
): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis unavailable - authentication temporarily disabled');
  }

  try {
    const key = `${REDIS_NONCE_PREFIX}${walletAddress}`;
    const storedNonce = await redis.get(key);
    if (!storedNonce || storedNonce !== nonce) {
      return false;
    }
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Redis nonce verify failed:', error);
    throw new Error('Authentication service temporarily unavailable');
  }
}
