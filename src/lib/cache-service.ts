
interface CacheEntry<T> {
    value: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Retrieves a value from the in-memory cache if it exists and has not expired.
 * @param key The cache key.
 * @returns The cached value or null.
 */
export function getCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
        // console.log(`[CacheService] Cache HIT for key: ${key}`);
        return entry.value as T;
    }
    // console.log(`[CacheService] Cache MISS for key: ${key}`);
    return null;
}

/**
 * Stores a value in the in-memory cache with a specific time-to-live.
 * @param key The cache key.
 * @param value The value to store.
 * @param ttlSeconds The time-to-live in seconds.
 */
export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    cache.set(key, { value, expiry });
    // console.log(`[CacheService] Cache SET for key: ${key} with TTL: ${ttlSeconds}s`);
}

/**
 * Clears the entire in-memory cache.
 */
export function clearCache(): void {
    cache.clear();
    // console.log(`[CacheService] Cache CLEARED.`);
}
