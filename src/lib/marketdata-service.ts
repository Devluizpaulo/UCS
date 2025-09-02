
'use server';

import type { HistoryInterval, MarketDataQuoteResponse, MarketDataHistoryResponse, HistoricalQuote, MarketDataSearchResponse, SearchedAsset } from './types';
import { getApiConfig } from './api-config-service';
import { getCommodities } from './commodity-config-service';
import { getDb } from './firebase-admin-config'; // Correctly use server-side db
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';


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


// Function to get detailed historical data for a single asset for the modal
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval): Promise<HistoricalQuote[]> {
    const commodities = await getCommodities();
    const commodityInfo = commodities.find(c => c.name === assetName);

    if (!commodityInfo) {
        throw new Error(`Asset ${assetName} not found in config.`);
    }
  
    const resolutionMap = { '1d': 'D', '1wk': 'W', '1mo': 'M' };
    const countbackMap = { '1d': 90, '1wk': 52, '1mo': 60 }; // 3 months, 1 year, 5 years

    try {
        const history = await getMarketDataHistory(
            commodityInfo.ticker,
            resolutionMap[interval] as 'D' | 'W' | 'M',
            countbackMap[interval]
        );

        if (history.s !== 'ok') {
            throw new Error(`MarketData API returned error for ${assetName}: ${history.errmsg || 'Unknown error'}`);
        }
    
        const formattedHistory: HistoricalQuote[] = [];
        for (let i = 0; i < history.t.length; i++) {
            const prevClose = i > 0 ? history.c[i - 1] : history.o[i];
            const change = prevClose !== 0 ? ((history.c[i] - prevClose) / prevClose) * 100 : 0;
            formattedHistory.push({
                date: new Date(history.t[i] * 1000).toLocaleDateString('pt-BR'),
                open: history.o[i],
                high: history.h[i],
                low: history.l[i],
                close: history.c[i],
                volume: history.v[i].toString(),
                change: change,
            });
        }
    
        return formattedHistory;

    } catch (error) {
        console.error(`Failed to get historical data for ${assetName}:`, error);
        return []; // Return empty array on failure
    }
}


export async function searchMarketDataAssets(query: string): Promise<SearchedAsset[]> {
    const config = await getApiConfig();
    const cacheKey = getCacheKey('md_search', { query });
    const cachedEntry = cache.get(cacheKey);

    if (isValidCacheEntry(cachedEntry)) {
        console.log(`[CACHE HIT] Search for ${query}`);
        return cachedEntry.data;
    }

    const params = new URLSearchParams({ query });
    // This endpoint is hypothetical, assuming MarketData has a symbol search.
    // If this fails, the endpoint URL might need to be adjusted.
    const data: MarketDataSearchResponse = await fetchFromApi('/stocks/search/', params, config.marketData.TIMEOUTS.QUOTE);
    
    if (data.s !== 'ok' || !data.symbol) {
        return [];
    }

    const results: SearchedAsset[] = data.symbol.map((symbol, index) => ({
        symbol,
        description: data.description[index],
        country: data.country[index],
    }));
    
    cache.set(cacheKey, { data: results, timestamp: Date.now(), ttl: config.marketData.CACHE_TTL.HISTORICAL }); // Longer TTL for search
    return results;
}
