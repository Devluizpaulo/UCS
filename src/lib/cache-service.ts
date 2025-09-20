
'use server';

import { unstable_cache as cache } from 'next/cache';

/**
 * A simplified wrapper around Next.js unstable_cache.
 * It caches the result of an async function.
 * @param key The unique key for the cache entry.
 * @param expensiveOperation The async function to execute and cache.
 * @param ttlSeconds Time-to-live in seconds.
 */
const revalidateOperation = <T>(key: string, expensiveOperation: () => Promise<T>, ttlSeconds: number) => {
    const cachedOperation = cache(
        async () => {
            console.log(`[CacheService] Running expensive operation for key: ${key}`);
            return expensiveOperation();
        },
        [key],
        { revalidate: ttlSeconds }
    );
    return cachedOperation();
};


export async function getCache<T>(key: string, ttlSeconds: number): Promise<T | null> {
    try {
        const result = await revalidateOperation(key, async () => {
            // This is a placeholder; actual data fetching happens where this is called.
            // In a real get/set cache, you'd fetch from a store here.
            // For unstable_cache, the "expensive operation" is passed directly.
            // This function's structure is for compatibility with a potential future switch to a real cache provider.
            return null; // We don't actually "get" anything here, just use the wrapper
        }, ttlSeconds);
        // This is a bit of a hack. Since unstable_cache doesn't have a separate "get",
        // we'll rely on the caller to pass the data-fetching function.
        // This function becomes more of a placeholder.
        return result as T | null;
    } catch (error) {
        console.error(`[CacheService] Error getting cache for key ${key}:`, error);
        return null;
    }
}


export async function setCache<T>(key: string, value: T): Promise<void> {
    try {
        // unstable_cache doesn't have a direct "set" function. The "setting" happens
        // when the cached function is executed. This function is kept for API consistency
        // but doesn't perform a direct action in this implementation.
        // The actual caching will happen in the `getCommodityPrices` function itself.
        // console.log(`[CacheService] "setCache" called for key: ${key}, but unstable_cache handles it via function execution.`);
    } catch (error) {
        console.error(`[CacheService] Error setting cache for key ${key}:`, error);
    }
}
