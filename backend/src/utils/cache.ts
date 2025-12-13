import { getRedisClient } from './redis';

/**
 * Cache utility for query results
 */
export class CacheService {
  private defaultTTL = 300; // 5 minutes default

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(key: string, data: any, ttl: number = this.defaultTTL): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete cached data by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Generate cache key for articles
   */
  articleKey(slug: string): string {
    return `article:${slug}`;
  }

  /**
   * Generate cache key for article lists
   */
  articlesListKey(params: {
    page?: number;
    status?: string;
    search?: string;
    tag?: string;
  }): string {
    const { page = 1, status = 'all', search = '', tag = '' } = params;
    return `articles:list:${status}:${page}:${search}:${tag}`;
  }

  /**
   * Generate cache key for user articles
   */
  userArticlesKey(walletAddress: string): string {
    return `articles:user:${walletAddress}`;
  }

  /**
   * Generate cache key for tags
   */
  tagsKey(): string {
    return 'tags:all';
  }

  /**
   * Generate cache key for user profile
   */
  userProfileKey(walletAddress: string): string {
    return `user:${walletAddress}`;
  }

  /**
   * Generate cache key for trending articles
   */
  trendingKey(): string {
    return 'articles:trending';
  }

  /**
   * Generate cache key for featured articles
   */
  featuredKey(): string {
    return 'articles:featured';
  }
}

export const cache = new CacheService();
