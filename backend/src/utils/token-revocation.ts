import { getRedisClient } from '@/utils/redis';
import { logger } from '@/utils/logger';

const REVOKED_TOKEN_PREFIX = 'revoked:token:';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days (match JWT expiry)

/**
 * Add a token to the revocation blacklist
 * Tokens are stored in Redis with automatic expiry matching JWT lifetime
 */
export async function revokeToken(tokenId: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis unavailable - cannot revoke token');
  }

  try {
    await redis.setex(`${REVOKED_TOKEN_PREFIX}${tokenId}`, TOKEN_EXPIRY_SECONDS, '1');
    logger.info(`Token revoked: ${tokenId.substring(0, 12)}...`);
  } catch (error) {
    logger.error('Failed to revoke token:', error);
    throw new Error('Token revocation failed');
  }
}

/**
 * Check if a token has been revoked
 */
export async function isTokenRevoked(tokenId: string): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    // If Redis is down, fail secure by rejecting the token
    logger.warn('Redis unavailable - rejecting token check');
    return true;
  }

  try {
    const exists = await redis.exists(`${REVOKED_TOKEN_PREFIX}${tokenId}`);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check token revocation:', error);
    // Fail secure - treat as revoked if we can't verify
    return true;
  }
}

/**
 * Revoke all tokens for a specific user
 */
export async function revokeUserTokens(userId: string): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error('Redis unavailable - cannot revoke user tokens');
  }

  try {
    // Set a flag that all tokens issued before this timestamp are invalid
    const revokeTimestamp = Date.now().toString();
    await redis.set(`user:revoke:${userId}`, revokeTimestamp);
    logger.info(`All tokens revoked for user: ${userId}`);
  } catch (error) {
    logger.error('Failed to revoke user tokens:', error);
    throw new Error('User token revocation failed');
  }
}

/**
 * Check if a token was issued before user-wide revocation
 */
export async function isTokenRevokedForUser(
  userId: string,
  tokenIssuedAt: number
): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    logger.warn('Redis unavailable - rejecting user token check');
    return true;
  }

  try {
    const revokeTimestamp = await redis.get(`user:revoke:${userId}`);
    if (!revokeTimestamp) {
      return false;
    }

    const revokeTime = parseInt(revokeTimestamp, 10);
    // Token is revoked if it was issued before the revocation timestamp
    return tokenIssuedAt * 1000 < revokeTime; // JWT iat is in seconds
  } catch (error) {
    logger.error('Failed to check user token revocation:', error);
    return true;
  }
}
