/**
 * Caching utility for API responses
 * Implements memory-based caching with TTL (Time To Live) support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.cache.set(key, entry);
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Destroy the cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Cache decorator for API functions
 */
export function withCache<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttlMs: number = CACHE_TTL.MEDIUM,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args);

    // Try to get from cache first
    const cached = cache.get<R>(cacheKey);
    if (cached !== null) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache hit for key: ${cacheKey}`);
      }
      return cached;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Cache miss for key: ${cacheKey}`);
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(cacheKey, result, ttlMs);

    return result;
  };
}

/**
 * Cache middleware for Next.js API routes
 */
export function createCacheMiddleware(ttlMs: number = CACHE_TTL.MEDIUM) {
  return (key: string) => ({
    get: <T>(): T | null => cache.get<T>(key),
    set: <T>(data: T): void => cache.set(key, data, ttlMs),
    invalidate: (): boolean => cache.delete(key),
  });
}

/**
 * Popular names cache utilities
 */
export const PopularNamesCache = {
  generateKey: (gender: string, count: number): string =>
    `popular_names:${gender}:${count}`,

  get: <T>(gender: string, count: number): T | null =>
    cache.get<T>(PopularNamesCache.generateKey(gender, count)),

  set: <T>(gender: string, count: number, data: T, ttlMs: number = CACHE_TTL.LONG): void =>
    cache.set(PopularNamesCache.generateKey(gender, count), data, ttlMs),

  invalidate: (gender: string, count: number): boolean =>
    cache.delete(PopularNamesCache.generateKey(gender, count)),
};

/**
 * User data cache utilities (short TTL for frequently changing data)
 */
export const UserDataCache = {
  generateKey: (userId: string, dataType: string): string =>
    `user_data:${userId}:${dataType}`,

  get: <T>(userId: string, dataType: string): T | null =>
    cache.get<T>(UserDataCache.generateKey(userId, dataType)),

  set: <T>(userId: string, dataType: string, data: T): void =>
    cache.set(UserDataCache.generateKey(userId, dataType), data, CACHE_TTL.SHORT),

  invalidate: (userId: string, dataType: string): boolean =>
    cache.delete(UserDataCache.generateKey(userId, dataType)),

  invalidateAllUserData: (userId: string): void => {
    const stats = cache.getStats();
    stats.keys
      .filter(key => key.startsWith(`user_data:${userId}:`))
      .forEach(key => cache.delete(key));
  },
};

/**
 * Rate limiting cache utilities
 */
export const RateLimitCache = {
  generateKey: (ip: string, endpoint: string): string =>
    `rate_limit:${ip}:${endpoint}`,

  get: (ip: string, endpoint: string): number | null =>
    cache.get<number>(RateLimitCache.generateKey(ip, endpoint)),

  set: (ip: string, endpoint: string, count: number): void =>
    cache.set(RateLimitCache.generateKey(ip, endpoint), count, CACHE_TTL.LONG),

  increment: (ip: string, endpoint: string): number => {
    const current = RateLimitCache.get(ip, endpoint) || 0;
    const newCount = current + 1;
    RateLimitCache.set(ip, endpoint, newCount);
    return newCount;
  },
};

/**
 * API response caching wrapper
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttlMs: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;

  // Try cache first
  const cached = cache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(cacheKey, data, ttlMs);

  return data;
}

/**
 * Clean cache for specific patterns
 */
export function invalidateCachePattern(pattern: string): number {
  const stats = cache.getStats();
  let invalidatedCount = 0;

  stats.keys
    .filter(key => key.includes(pattern))
    .forEach(key => {
      cache.delete(key);
      invalidatedCount++;
    });

  return invalidatedCount;
}

// Export the global cache instance for advanced usage
export { cache };

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => cache.destroy());
  process.on('SIGINT', () => cache.destroy());
  process.on('SIGTERM', () => cache.destroy());
}