
'use server';

/**
 * @fileOverview A simple in-memory caching service for server-side data.
 * This helps reduce redundant database reads for frequently accessed data.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Default Time-to-Live for cache entries in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Sets a value in the cache.
 * @param key The unique key for the cache entry.
 * @param data The data to be cached.
 */
export async function setCache<T>(key: string, data: T) {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  cache.set(key, entry);
  console.log(`[CacheService] Set cache for key: ${key}`);
}

/**
 * Gets a value from the cache if it exists and is not expired.
 * @param key The key of the cache entry to retrieve.
 * @param ttl The maximum age of the cache entry in milliseconds.
 * @returns The cached data or null if not found or expired.
 */
export async function getCache<T>(key: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  const isExpired = Date.now() - entry.timestamp > ttl;
  if (isExpired) {
    cache.delete(key);
    console.log(`[CacheService] Expired cache for key: ${key}`);
    return null;
  }

  console.log(`[CacheService] Hit cache for key: ${key}`);
  return entry.data as T;
}

/**
 * Clears a specific entry from the cache.
 * @param key The key of the cache entry to clear.
 */
export async function clearCache(key: string) {
  cache.delete(key);
  console.log(`[CacheService] Cleared cache for key: ${key}`);
}

/**
 * Clears the entire cache.
 */
export async function clearAllCache() {
  cache.clear();
  console.log('[CacheService] Cleared all cache.');
}
