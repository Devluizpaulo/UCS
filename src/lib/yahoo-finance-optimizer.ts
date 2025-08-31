'use server';

import { getCachedQuote, getCachedHistorical } from './yahoo-finance-cache';
import { COMMODITY_TICKER_MAP } from './yahoo-finance-config-data';
import { getConversionTickers } from './yahoo-finance-config';
import type { HistoryInterval } from './types';

// Request batching and deduplication
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

const pendingQuoteRequests = new Map<string, PendingRequest[]>();
const pendingHistoricalRequests = new Map<string, PendingRequest[]>();

// Batch timeout (ms) - requests within this window will be batched together
const BATCH_TIMEOUT = 100;

// Optimized quote fetching with request batching
export async function getOptimizedQuote(ticker: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestKey = ticker;
    
    // Check if there's already a pending request for this ticker
    if (!pendingQuoteRequests.has(requestKey)) {
      pendingQuoteRequests.set(requestKey, []);
      
      // Schedule batch execution
      setTimeout(async () => {
        const requests = pendingQuoteRequests.get(requestKey) || [];
        pendingQuoteRequests.delete(requestKey);
        
        if (requests.length === 0) return;
        
        try {
          console.log(`[BATCH] Fetching quote for ${ticker} (${requests.length} requests)`);
          const result = await getCachedQuote(ticker);
          
          // Resolve all pending requests with the same result
          requests.forEach(req => req.resolve(result));
        } catch (error) {
          // Reject all pending requests with the same error
          requests.forEach(req => req.reject(error));
        }
      }, BATCH_TIMEOUT);
    }
    
    // Add this request to the pending list
    pendingQuoteRequests.get(requestKey)!.push({
      resolve,
      reject,
      timestamp: Date.now(),
    });
  });
}

// Optimized batch quote fetching for multiple tickers
export async function getOptimizedBatchQuotes(tickers: string[]): Promise<any[]> {
  // Remove duplicates and sort for consistent caching
  const uniqueTickers = [...new Set(tickers)].sort();
  const batchKey = uniqueTickers.join(',');
  
  return new Promise((resolve, reject) => {
    // Check if there's already a pending request for this exact batch
    if (!pendingQuoteRequests.has(batchKey)) {
      pendingQuoteRequests.set(batchKey, []);
      
      // Schedule batch execution
      setTimeout(async () => {
        const requests = pendingQuoteRequests.get(batchKey) || [];
        pendingQuoteRequests.delete(batchKey);
        
        if (requests.length === 0) return;
        
        try {
          console.log(`[BATCH] Fetching quotes for ${uniqueTickers.length} tickers (${requests.length} requests)`);
          const result = await getCachedQuote(uniqueTickers);
          
          // Resolve all pending requests with the same result
          requests.forEach(req => req.resolve(result));
        } catch (error) {
          // Reject all pending requests with the same error
          requests.forEach(req => req.reject(error));
        }
      }, BATCH_TIMEOUT);
    }
    
    // Add this request to the pending list
    pendingQuoteRequests.get(batchKey)!.push({
      resolve,
      reject,
      timestamp: Date.now(),
    });
  });
}

// Optimized historical data fetching with request deduplication
export async function getOptimizedHistorical(
  ticker: string,
  options: any,
  interval: HistoryInterval = '1d'
): Promise<any> {
  const requestKey = `${ticker}:${JSON.stringify(options)}:${interval}`;
  
  return new Promise((resolve, reject) => {
    // Check if there's already a pending request for this exact query
    if (!pendingHistoricalRequests.has(requestKey)) {
      pendingHistoricalRequests.set(requestKey, []);
      
      // Schedule execution
      setTimeout(async () => {
        const requests = pendingHistoricalRequests.get(requestKey) || [];
        pendingHistoricalRequests.delete(requestKey);
        
        if (requests.length === 0) return;
        
        try {
          console.log(`[DEDUP] Fetching historical data for ${ticker} (${interval}) (${requests.length} requests)`);
          const result = await getCachedHistorical(ticker, options, interval);
          
          // Resolve all pending requests with the same result
          requests.forEach(req => req.resolve(result));
        } catch (error) {
          // Reject all pending requests with the same error
          requests.forEach(req => req.reject(error));
        }
      }, BATCH_TIMEOUT);
    }
    
    // Add this request to the pending list
    pendingHistoricalRequests.get(requestKey)!.push({
      resolve,
      reject,
      timestamp: Date.now(),
    });
  });
}

// Smart commodity price fetching with intelligent batching
export async function getOptimizedCommodityPrices(commodityNames: string[]): Promise<any[]> {
  // Get all required tickers including conversion rates
  const requestedCommodities = commodityNames
    .map(name => COMMODITY_TICKER_MAP[name])
    .filter(Boolean);
  
  const conversionTickers = await getConversionTickers();
  const allTickers = [...new Set([
    ...requestedCommodities.map(c => c.ticker),
    ...conversionTickers
  ])];
  
  if (allTickers.length === 0) {
    return [];
  }
  
  // Use optimized batch quote fetching
  const quotes = await getOptimizedBatchQuotes(allTickers);
  
  // Process the results
  const getQuote = (ticker: string) => quotes.find((q: any) => q.symbol === ticker);
  
  return commodityNames.map((name) => {
    const commodityInfo = COMMODITY_TICKER_MAP[name];
    if (!commodityInfo) return null;
    
    const quote = getQuote(commodityInfo.ticker);
    if (!quote) return null;
    
    let price: number;
    let lastUpdated: string;
    
    // Use real-time price for exchange rates, and previous close for other commodities.
    if (commodityInfo.category === 'exchange') {
        price = quote.regularMarketPrice ?? quote.regularMarketPreviousClose ?? 0;
        lastUpdated = quote.regularMarketTime && typeof quote.regularMarketTime === 'number' ?
          new Date(quote.regularMarketTime * 1000).toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
          }) : 'N/A';
    } else {
        price = quote.regularMarketPreviousClose ?? quote.regularMarketPrice ?? 0;
        lastUpdated = `Fech. ${new Date(quote.regularMarketTime * 1000).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}`;
    }

    const absoluteChange = quote.regularMarketChange ?? 0;
    const previousClose = price - absoluteChange;
    const change = previousClose === 0 ? 0 : (absoluteChange / previousClose) * 100;
    
    return {
      name: name,
      ticker: quote.symbol,
      price: parseFloat(price.toFixed(4)),
      change: parseFloat(change.toFixed(2)) || 0,
      absoluteChange: parseFloat(absoluteChange.toFixed(4)),
      lastUpdated: lastUpdated,
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);
}


// Performance monitoring
interface PerformanceMetrics {
  totalRequests: number;
  batchedRequests: number;
  cacheHits: number;
  averageResponseTime: number;
  errorRate: number;
}

const performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  batchedRequests: 0,
  cacheHits: 0,
  averageResponseTime: 0,
  errorRate: 0,
};

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return { ...performanceMetrics };
}

export async function resetPerformanceMetrics(): Promise<void> {
  Object.assign(performanceMetrics, {
    totalRequests: 0,
    batchedRequests: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    errorRate: 0,
  });
}

// Cleanup function to remove stale pending requests
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 1000; // 30 seconds
  
  // Clean up quote requests
  for (const [key, requests] of pendingQuoteRequests.entries()) {
    const validRequests = requests.filter(req => now - req.timestamp < maxAge);
    if (validRequests.length === 0) {
      pendingQuoteRequests.delete(key);
    } else if (validRequests.length !== requests.length) {
      pendingQuoteRequests.set(key, validRequests);
    }
  }
  
  // Clean up historical requests
  for (const [key, requests] of pendingHistoricalRequests.entries()) {
    const validRequests = requests.filter(req => now - req.timestamp < maxAge);
    if (validRequests.length === 0) {
      pendingHistoricalRequests.delete(key);
    } else if (validRequests.length !== requests.length) {
      pendingHistoricalRequests.set(key, validRequests);
    }
  }
}, 60 * 1000); // Run every minute
