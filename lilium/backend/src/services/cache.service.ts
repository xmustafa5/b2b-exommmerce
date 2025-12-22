import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const DEFAULT_TTL = 300; // 5 minutes default

export class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor(private fastify: FastifyInstance) {
    this.initializeRedis();
  }

  private initializeRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.fastify.log.warn('REDIS_URL not set. Caching is disabled.');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.fastify.log.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.enabled = true;
        this.fastify.log.info('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        this.fastify.log.error('Redis error:', err.message);
        this.enabled = false;
      });

      this.redis.on('close', () => {
        this.enabled = false;
        this.fastify.log.warn('Redis connection closed');
      });

      // Connect
      this.redis.connect().catch((err) => {
        this.fastify.log.error('Redis connection failed:', err.message);
      });
    } catch (error: any) {
      this.fastify.log.error('Failed to initialize Redis:', error.message);
    }
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  /**
   * Generate a cache key with optional prefix
   */
  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    if (!this.isEnabled()) return null;

    try {
      const cacheKey = this.getKey(key, prefix);
      const data = await this.redis!.get(cacheKey);

      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error: any) {
      this.fastify.log.error(`Cache get error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const cacheKey = this.getKey(key, options.prefix);
      const ttl = options.ttl || DEFAULT_TTL;

      await this.redis!.setex(cacheKey, ttl, JSON.stringify(value));
      return true;
    } catch (error: any) {
      this.fastify.log.error(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string, prefix?: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      const cacheKey = this.getKey(key, prefix);
      await this.redis!.del(cacheKey);
      return true;
    } catch (error: any) {
      this.fastify.log.error(`Cache delete error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) return 0;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length === 0) return 0;

      const deleted = await this.redis!.del(...keys);
      return deleted;
    } catch (error: any) {
      this.fastify.log.error(`Cache delete pattern error for ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Get or set cached value with callback
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options.prefix);
    if (cached !== null) {
      return cached;
    }

    // Execute callback and cache result
    const result = await callback();
    await this.set(key, result, options);

    return result;
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      await this.redis!.flushdb();
      return true;
    } catch (error: any) {
      this.fastify.log.error('Cache flush error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.enabled = false;
    }
  }
}

// Cache key prefixes
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
  CATEGORY: 'category',
  ANALYTICS: 'analytics',
  PROMOTIONS: 'promotions',
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PRODUCTS_LIST: 60,        // 1 minute for product list
  PRODUCT_DETAIL: 120,      // 2 minutes for product detail
  CATEGORIES: 300,          // 5 minutes for categories
  ANALYTICS: 60,            // 1 minute for analytics
  PROMOTIONS: 120,          // 2 minutes for promotions
} as const;
