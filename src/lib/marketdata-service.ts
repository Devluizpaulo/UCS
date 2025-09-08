
'use server';
/**
 * @fileOverview A service for fetching data from the MarketData.app API.
 * This should ONLY be called from server-side flows, as it may use an API key.
 */

const API_BASE_URL = 'https://api.marketdata.app/v1/stocks/quotes/';

type MarketDataQuote = {
    symbol: string[],
    last: number[],
    open: number[],
    high: number[],
    low: number[],
    volume: number[],
    updated: string[]
};

export type UnifiedQuote = {
    symbol: string,
    last: number,
    open: number,
    high: number,
    low: number,
    volume: number,
    updated: string,
};

/**
 * Fetches the latest quote for a given stock/commodity ticker.
 * @param {string} ticker - The ticker symbol (e.g., 'AAPL', 'GOOGL').
 * @returns {Promise<UnifiedQuote>} A promise that resolves to the quote data.
 */
export async function fetchLatestPrice(ticker: string): Promise<UnifiedQuote> {
    const apiKey = process.env.MARKETDATA_API_KEY;
    if (!apiKey) {
        throw new Error("MARKETDATA_API_KEY environment variable is not set.");
    }
    
    const url = `${API_BASE_URL}${ticker}/?token=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            // Vercel/Next.js specific caching options
            next: { revalidate: 60 } // Revalidate every 60 seconds
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MarketData API request failed with status ${response.status}: ${errorText}`);
        }

        const data: MarketDataQuote = await response.json();
        
        if (data.symbol.length === 0) {
            throw new Error(`No data returned from MarketData for ticker ${ticker}.`);
        }
        
        // The API returns arrays, so we extract the first element.
        return {
            symbol: data.symbol[0],
            last: data.last[0],
            open: data.open[0],
            high: data.high[0],
            low: data.low[0],
            volume: data.volume[0],
            updated: data.updated[0]
        };

    } catch (error) {
        console.error(`[MarketDataService] Failed to fetch price for ${ticker}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
