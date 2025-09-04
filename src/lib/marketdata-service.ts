
'use server';

import type { HistoryInterval, HistoricalQuote } from './types';
import { getCommodities } from './commodity-config-service';
import yahooFinance from 'yahoo-finance2';
import { sub, format } from 'date-fns';

/**
 * Gets a single, most recent quote for a given ticker from Yahoo Finance.
 * @param ticker The stock/commodity ticker symbol.
 * @returns The most recent regular market price.
 */
export async function getYahooFinanceQuote(ticker: string): Promise<number> {
    try {
        const quote = await yahooFinance.quote(ticker);
        // For futures, the price might be in pre or post market, so we check in order
        const price = quote?.regularMarketPrice ?? quote?.preMarketPrice ?? quote?.postMarketPrice ?? 0;
        
        if (price === 0) {
           console.warn(`[Yahoo] Ticker ${ticker} returned a price of 0.`);
        }

        // Yahoo returns some futures prices (like ZC=F for corn) in cents. We need to convert to dollars.
        if (quote?.currency === 'USd') {
            return price / 100;
        }
        
        return price;
    } catch (error) {
        console.error(`[Yahoo] Failed to fetch quote for ticker ${ticker}:`, error);
        throw new Error(`Could not fetch quote for ${ticker} from Yahoo Finance.`);
    }
}


/**
 * Gets historical data for a given ticker from Yahoo Finance.
 * @param ticker The stock/commodity ticker symbol.
 * @param interval The desired interval ('1d', '1wk', '1mo').
 * @returns An array of historical data points.
 */
export async function getYahooFinanceHistory(ticker: string, interval: HistoryInterval = '1d'): Promise<HistoricalQuote[]> {
    const periodMap = {
        '1d': { period1: sub(new Date(), { months: 3 }) }, // Last 3 months for daily
        '1wk': { period1: sub(new Date(), { years: 2 }) }, // Last 2 years for weekly
        '1mo': { period1: sub(new Date(), { years: 5 }) }, // Last 5 years for monthly
    };

    try {
        const results = await yahooFinance.historical(ticker, {
            period1: format(periodMap[interval].period1, 'yyyy-MM-dd'),
            interval: interval,
        });

        if (!results || results.length === 0) {
            return [];
        }

        return results.map((data, index, arr) => {
            const prevClose = index > 0 ? arr[index - 1].close : data.open;
            const change = prevClose !== 0 ? ((data.close - prevClose) / prevClose) * 100 : 0;
            
            return {
                date: format(new Date(data.date), 'dd/MM/yyyy'),
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close,
                volume: data.volume?.toString() ?? '0',
                change: change,
            };
        });

    } catch (error) {
        console.error(`[Yahoo] Failed to fetch history for ticker ${ticker}:`, error);
        throw new Error(`Could not fetch history for ${ticker} from Yahoo Finance.`);
    }
}


/**
 * Wrapper function to get historical data for an asset by its internal name (e.g., 'Soja Futuros').
 * This is used by the AssetDetailModal to populate charts and tables.
 * @param assetName The internal name of the asset from the configuration.
 * @param interval The desired interval.
 * @returns An array of historical quotes.
 */
export async function getAssetHistoricalData(assetName: string, interval: HistoryInterval): Promise<HistoricalQuote[]> {
    const commodities = await getCommodities();
    const commodityInfo = commodities.find(c => c.name === assetName);

    if (!commodityInfo) {
        throw new Error(`Asset ${assetName} not found in config.`);
    }

    try {
        return await getYahooFinanceHistory(commodityInfo.ticker, interval);
    } catch (error) {
        console.error(`Failed to get historical data for ${assetName} via wrapper:`, error);
        return []; // Return empty array on failure to avoid crashing the UI
    }
}
