
'use server';

import type { CommodityPriceData, HistoryInterval, MarketDataQuoteResponse, MarketDataHistoryResponse } from './types';
import { getApiConfig } from './api-config-service';
import { getCommodityConfig } from './commodity-config-service';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from './firebase-config';

// In-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
const cache = new Map<string, CacheEntry<any>>();

function getCacheKey(type: string, params: any): string {
  return `${type}:${JSON.stringify(params)}`;
}

function isValidCacheEntry<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

async function fetchFromApi(endpoint: string, params: URLSearchParams, timeout: number): Promise<any> {
    const config = await getApiConfig();
    const apiKey = process.env.MARKETDATA_API_KEY;

    if (!apiKey) {
        throw new Error("MarketData API key is not configured.");
    }
    
    params.append('token', apiKey);
    const url = `${config.marketData.API_BASE_URL}${endpoint}?${params.toString()}`;
    
    console.log(`[API CALL] Fetching from ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }
        
        const data = await response.json();
        if (data.s !== 'ok' && data.s !== 'no_data') { // allow no_data for some queries
            // MarketData can sometimes return a string error message.
            const errorMessage = typeof data.errmsg === 'string' ? data.errmsg : 'Unknown API error';
            throw new Error(`API returned an error: ${errorMessage}`);
        }
        
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[API ERROR] Failed to fetch from ${url}:`, error);
        throw error;
    }
}


export async function getMarketDataQuote(ticker: string): Promise<MarketDataQuoteResponse> {
    const config = await getApiConfig();
    const cacheKey = getCacheKey('md_quote', { ticker });
    const cachedEntry = cache.get(cacheKey);

    if (isValidCacheEntry(cachedEntry)) {
        console.log(`[CACHE HIT] Quote for ${ticker}`);
        return cachedEntry.data;
    }

    const params = new URLSearchParams({ symbol: ticker });
    const data: MarketDataQuoteResponse = await fetchFromApi('/stocks/quotes/', params, config.marketData.TIMEOUTS.QUOTE);
    
    if (data.s === 'no_data' || !data.symbol || data.symbol.length === 0) {
        throw new Error(`No data returned from API for ticker ${ticker}`);
    }
    
    cache.set(cacheKey, { data, timestamp: Date.now(), ttl: config.marketData.CACHE_TTL.QUOTE });
    return data;
}

export async function getMarketDataHistory(ticker: string, resolution: 'D' | 'W' | 'M' = 'D', countback: number = 30): Promise<MarketDataHistoryResponse> {
    const config = await getApiConfig();
    const cacheKey = getCacheKey('md_history', { ticker, resolution, countback });
    const cachedEntry = cache.get(cacheKey);

    if (isValidCacheEntry(cachedEntry)) {
        console.log(`[CACHE HIT] History for ${ticker}`);
        return cachedEntry.data;
    }

    const params = new URLSearchParams({
        symbol: ticker,
        resolution,
        countback: countback.toString()
    });
    const data: MarketDataHistoryResponse = await fetchFromApi('/stocks/candles/', params, config.marketData.TIMEOUTS.HISTORICAL);
    
    cache.set(cacheKey, { data, timestamp: Date.now(), ttl: config.marketData.CACHE_TTL.HISTORICAL });
    return data;
}
