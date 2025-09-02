
'use server';

import type { CommodityPriceData, HistoryInterval, MarketDataQuoteResponse, MarketDataHistoryResponse } from './types';
import { getApiConfig } from './api-config-service';
import { getCommodityConfig } from './commodity-config-service';

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
        if (data.s !== 'ok') {
            throw new Error(`API returned an error: ${data.message || 'Unknown error'}`);
        }
        
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[API ERROR] Failed to fetch from ${url}:`, error);
        throw error;
    }
}


export async function getMarketDataQuote(ticker: string): Promise<any> {
    const config = await getApiConfig();
    const cacheKey = getCacheKey('md_quote', { ticker });
    const cachedEntry = cache.get(cacheKey);

    if (isValidCacheEntry(cachedEntry)) {
        console.log(`[CACHE HIT] Quote for ${ticker}`);
        return cachedEntry.data;
    }

    const params = new URLSearchParams({ symbol: ticker });
    const data: MarketDataQuoteResponse = await fetchFromApi('/stocks/quotes/', params, config.marketData.TIMEOUTS.QUOTE);
    
    const quote = {
        symbol: data.symbol[0],
        last: data.last[0],
        updated: new Date(data.updated[0] * 1000),
    };
    
    cache.set(cacheKey, { data: quote, timestamp: Date.now(), ttl: config.marketData.CACHE_TTL.QUOTE });
    return quote;
}

export async function getMarketDataHistory(ticker: string, resolution: 'D' | 'W' | 'M' = 'D', countback: number = 30): Promise<any> {
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

export async function getMarketDataCandles(commodityNames: string[]): Promise<CommodityPriceData[]> {
    const { commodityMap } = await getCommodityConfig();
    const priceData: CommodityPriceData[] = [];

    for (const name of commodityNames) {
        try {
            const commodityInfo = commodityMap[name];
            if (!commodityInfo) continue;

            // Using history to get the last closing price
            const history = await getMarketDataHistory(commodityInfo.ticker, 'D', 2);
            if (!history || history.c.length < 2) {
                console.warn(`[MarketData] Not enough historical data for ${name} to calculate change.`);
                continue;
            }
            
            const lastPrice = history.c[history.c.length - 1];
            const prevPrice = history.c[history.c.length - 2];
            const absoluteChange = lastPrice - prevPrice;
            const change = prevPrice !== 0 ? (absoluteChange / prevPrice) * 100 : 0;
            const lastUpdated = new Date(history.t[history.t.length - 1] * 1000);

            priceData.push({
                id: '', // Firestore will generate
                name,
                ticker: commodityInfo.ticker,
                price: lastPrice,
                change,
                absoluteChange,
                lastUpdated: `Fech. ${lastUpdated.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}`,
                currency: commodityInfo.currency,
            });

        } catch (error) {
            console.error(`[MarketData] Failed to fetch candle data for ${name}:`, error);
        }
    }

    return priceData;
}
