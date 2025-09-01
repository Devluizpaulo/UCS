
'use server';

import yahooFinance from 'yahoo-finance2';
import type { HistoryInterval } from './types';
import { getApiConfig } from './api-config-service';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache (in production, consider using Redis or similar)
const cache = new Map<string, CacheEntry<any>>();

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 100, // Default, will be overridden by DB config
  requests: [] as number[],
};

// Utility functions
function getCacheKey(type: string, params: any): string {
  return `${type}:${JSON.stringify(params)}`;
}

function isValidCacheEntry<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

async function checkRateLimit(): Promise<boolean> {
  const config = await getApiConfig();
  RATE_LIMIT.MAX_REQUESTS_PER_MINUTE = config.yahooFinance.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;
  
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Remove old requests
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => time > oneMinuteAgo);
  
  // Check if we're under the limit
  if (RATE_LIMIT.requests.length >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Add current request
  RATE_LIMIT.requests.push(now);
  return true;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Enhanced Yahoo Finance functions with caching and rate limiting
export async function getCachedQuote(tickers: string | string[], retries = 3): Promise<any> {
  const config = await getApiConfig();
  const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
  const cacheKey = getCacheKey('quote', tickerArray.sort());
  
  // Check cache first
  const cachedEntry = cache.get(cacheKey);
  if (isValidCacheEntry(cachedEntry)) {
    console.log(`[CACHE HIT] Quote for ${tickerArray.join(', ')}`);
    return cachedEntry.data;
  }
  
  // Check rate limit
  if (!await checkRateLimit()) {
    console.warn('[RATE LIMIT] Waiting before making request...');
    await delay(1000); // Wait 1 second
    if (!await checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }
  
  // Make API call with retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[API CALL] Fetching quote for ${tickerArray.join(', ')} (attempt ${attempt})`);
      const result = await yahooFinance.quote(tickers, {}, { timeout: config.yahooFinance.TIMEOUTS.QUOTE });
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: config.yahooFinance.CACHE_TTL.QUOTE,
      });
      
      return result;
    } catch (error: any) {
      console.error(`[API ERROR] Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        // Last attempt failed, throw error instead of returning fallback data
        console.error(`[FATAL API ERROR] Failed to fetch quote for ${tickerArray.join(', ')} after ${retries} attempts.`);
        throw new Error(`Failed to fetch quote for ${tickerArray.join(', ')}.`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[RETRY] Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

export async function getCachedHistorical(
  ticker: string,
  options: any,
  interval: HistoryInterval = '1d',
  retries = 3
): Promise<any> {
  const config = await getApiConfig();
  const cacheKey = getCacheKey('historical', { ticker, options, interval });
  
  // Determine TTL based on interval
  let ttl = config.yahooFinance.CACHE_TTL.HISTORICAL_1D;
  switch (interval) {
    case '1wk':
      ttl = config.yahooFinance.CACHE_TTL.HISTORICAL_1WK;
      break;
    case '1mo':
      ttl = config.yahooFinance.CACHE_TTL.HISTORICAL_1MO;
      break;
  }
  
  // Check cache first
  const cachedEntry = cache.get(cacheKey);
  if (isValidCacheEntry(cachedEntry)) {
    console.log(`[CACHE HIT] Historical data for ${ticker} (${interval})`);
    return cachedEntry.data;
  }
  
  // Check rate limit
  if (!await checkRateLimit()) {
    console.warn('[RATE LIMIT] Waiting before making request...');
    await delay(1000);
    if (!await checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }
  
  // Make API call with retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[API CALL] Fetching historical data for ${ticker} (${interval}) (attempt ${attempt})`);
      const result = await yahooFinance.historical(ticker, options, { timeout: config.yahooFinance.TIMEOUTS.HISTORICAL });
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });
      
      return result;
    } catch (error: any) {
      console.error(`[API ERROR] Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        // Last attempt failed, throw an error
        throw new Error(`Failed to fetch historical data for ${ticker} after ${retries} attempts.`);
      }
      
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[RETRY] Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

// Cache management functions
export async function clearCache(): Promise<void> {
  cache.clear();
  console.log('[CACHE] Cache cleared');
}

export async function getCacheStats(): Promise<{ size: number; entries: string[] }> {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[CACHE] Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes
