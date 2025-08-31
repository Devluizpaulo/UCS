'use server';

import yahooFinance from 'yahoo-finance2';
import type { HistoricalQuote, HistoryInterval } from './types';
import { YAHOO_FINANCE_CONFIG, COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';
import { getCommodityByTicker } from './yahoo-finance-config';

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
  MAX_REQUESTS_PER_MINUTE: YAHOO_FINANCE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
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

function checkRateLimit(): boolean {
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

// Fallback function to generate mock data when API fails
async function generateFallbackQuote(ticker: string): Promise<any> {
  const commodity = await getCommodityByTicker(ticker);
  const basePrice = commodity?.fallbackPrice || 100;
  
  // Generate some realistic variation (±2%)
  const variation = (Math.random() - 0.5) * 0.04;
  const price = basePrice * (1 + variation);
  const change = variation * 100;
  
  return {
    symbol: ticker,
    regularMarketPrice: price,
    regularMarketChange: basePrice * variation,
    regularMarketTime: Math.floor(Date.now() / 1000),
    currency: commodity?.currency || 'BRL',
  };
}

async function generateFallbackQuotes(tickers: string[]): Promise<any[]> {
    return Promise.all(tickers.map(ticker => generateFallbackQuote(ticker)));
}

// Enhanced Yahoo Finance functions with caching and rate limiting
export async function getCachedQuote(tickers: string | string[], retries = 3): Promise<any> {
  const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
  const cacheKey = getCacheKey('quote', tickerArray.sort());
  
  // Check cache first
  const cachedEntry = cache.get(cacheKey);
  if (isValidCacheEntry(cachedEntry)) {
    console.log(`[CACHE HIT] Quote for ${tickerArray.join(', ')}`);
    return cachedEntry.data;
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    console.warn('[RATE LIMIT] Waiting before making request...');
    await delay(1000); // Wait 1 second
    if (!checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }
  
  // Make API call with retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[API CALL] Fetching quote for ${tickerArray.join(', ')} (attempt ${attempt})`);
      const result = await yahooFinance.quote(tickers);
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: YAHOO_FINANCE_CONFIG.CACHE_TTL.QUOTE,
      });
      
      return result;
    } catch (error: any) {
      console.error(`[API ERROR] Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        // Last attempt failed, use fallback data
        console.warn(`[FALLBACK] Using mock data for ${tickerArray.join(', ')} after ${retries} failed attempts`);
        const fallbackData = Array.isArray(tickers) ? await generateFallbackQuotes(tickerArray) : await generateFallbackQuote(tickerArray[0]);
        
        // Cache fallback data with shorter TTL
        cache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now(),
          ttl: 60 * 1000, // 1 minute TTL for fallback data
        });
        
        return fallbackData;
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
  const cacheKey = getCacheKey('historical', { ticker, options, interval });
  
  // Determine TTL based on interval
  let ttl = YAHOO_FINANCE_CONFIG.CACHE_TTL.HISTORICAL_1D;
  switch (interval) {
    case '1wk':
      ttl = YAHOO_FINANCE_CONFIG.CACHE_TTL.HISTORICAL_1WK;
      break;
    case '1mo':
      ttl = YAHOO_FINANCE_CONFIG.CACHE_TTL.HISTORICAL_1MO;
      break;
  }
  
  // Check cache first
  const cachedEntry = cache.get(cacheKey);
  if (isValidCacheEntry(cachedEntry)) {
    console.log(`[CACHE HIT] Historical data for ${ticker} (${interval})`);
    return cachedEntry.data;
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    console.warn('[RATE LIMIT] Waiting before making request...');
    await delay(1000);
    if (!checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }
  
  // Make API call with retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[API CALL] Fetching historical data for ${ticker} (${interval}) (attempt ${attempt})`);
      const result = await yahooFinance.historical(ticker, options);
      
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
        // Last attempt failed, return empty array as fallback
        console.warn(`[FALLBACK] Returning empty historical data for ${ticker} after ${retries} failed attempts`);
        const fallbackData: any[] = [];
        
        // Cache empty fallback with shorter TTL
        cache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now(),
          ttl: 60 * 1000, // 1 minute TTL for fallback data
        });
        
        return fallbackData;
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
