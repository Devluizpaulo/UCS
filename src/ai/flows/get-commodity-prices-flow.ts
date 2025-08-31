'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the Yahoo Finance API.
 *
 * - getCommodityPrices - A function that returns real-time commodity prices.
 * - CommodityPricesInput - The input type for the getCommodityPrices function.
 * - CommodityPricesOutput - The return type for the getCommodityPrices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import yahooFinance from 'yahoo-finance2';
import type { CommodityPriceData } from '@/lib/types';

const CommodityPricesInputSchema = z.object({
  commodities: z.array(z.string()).describe('A list of commodity names to fetch prices for.'),
});
export type CommodityPricesInput = z.infer<typeof CommodityPricesInputSchema>;

const CommodityPricesOutputSchema = z.object({
  prices: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      price: z.number(),
      change: z.number(),
      absoluteChange: z.number(),
      lastUpdated: z.string(),
    })
  ).describe('A list of commodities with their prices and 24h change percentage.'),
});
export type CommodityPricesOutput = z.infer<typeof CommodityPricesOutputSchema>;

export async function getCommodityPrices(
  input: CommodityPricesInput
): Promise<CommodityPriceData[]> {
  const flowResult = await getCommodityPricesFlow(input);
  return flowResult.prices;
}

// Maps our commodity names to their Yahoo Finance tickers.
const commodityTickerMap: { [key: string]: { ticker: string, currency: 'BRL' | 'USD' | 'EUR' } } = {
  'USD/BRL Histórico': { ticker: 'BRL=X', currency: 'BRL' },
  'EUR/BRL Histórico': { ticker: 'EURBRL=X', currency: 'BRL' },
  'Boi Gordo Futuros': { ticker: 'BGI=F', currency: 'BRL' },
  'Soja Futuros': { ticker: 'ZS=F', currency: 'USD' },
  'Milho Futuros': { ticker: 'CCM=F', currency: 'BRL' },
  'Madeira Futuros': { ticker: 'LBS=F', currency: 'USD' },
  'Carbono Futuros': { ticker: 'KE=F', currency: 'EUR' }, // Using Potassium Sulfate as proxy, converting from EUR
};

const getCommodityPricesFlow = ai.defineFlow(
  {
    name: 'getCommodityPricesFlow',
    inputSchema: CommodityPricesInputSchema,
    outputSchema: CommodityPricesOutputSchema,
  },
  async (input) => {
    const requestedCommodities = input.commodities.map(name => commodityTickerMap[name]).filter(Boolean);

    // Always fetch conversion rates
    const conversionTickers = ['BRL=X', 'EURBRL=X'];
    const allTickers = [...new Set([...requestedCommodities.map(c => c.ticker), ...conversionTickers])];

    if (allTickers.length === 0) {
      return { prices: [] };
    }

    try {
      const quotes = await yahooFinance.quote(allTickers);

      const getQuote = (ticker: string) => quotes.find(q => q.symbol === ticker);

      const usdToBrlRate = getQuote('BRL=X')?.regularMarketPrice ?? 1;
      const eurToBrlRate = getQuote('EURBRL=X')?.regularMarketPrice ?? 1;

      const prices = input.commodities.map((name) => {
        const commodityInfo = commodityTickerMap[name];
        if (!commodityInfo) return null;

        const quote = getQuote(commodityInfo.ticker);
        if (!quote) return null;
        
        let price = quote.regularMarketPrice ?? 0;
        let absoluteChange = quote.regularMarketChange ?? 0;

        if (commodityInfo.currency === 'USD') {
            price *= usdToBrlRate;
            absoluteChange *= usdToBrlRate;
        } else if (commodityInfo.currency === 'EUR') {
            price *= eurToBrlRate;
            absoluteChange *= eurToBrlRate;
        }

        const originalPrice = quote.regularMarketPrice ?? 0;
        const change = originalPrice === 0 ? 0 : (absoluteChange / (price - absoluteChange)) * 100;

        const lastUpdated = quote.regularMarketTime && typeof quote.regularMarketTime === 'number' ? 
            new Date(quote.regularMarketTime * 1000).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'N/A';
        
        return {
          name: name,
          ticker: quote.symbol,
          price: parseFloat(price.toFixed(4)),
          change: parseFloat(change.toFixed(2)) || 0,
          absoluteChange: parseFloat(absoluteChange.toFixed(4)),
          lastUpdated: `Às ${lastUpdated} (GMT-3)`,
        };
      }).filter((p): p is CommodityPriceData => p !== null);

      return { prices };
    } catch (error) {
      console.error('[LOG] Error fetching from Yahoo Finance API:', error);
      // Fallback or error handling: return an empty list to prevent crashes.
      return { prices: [] };
    }
  }
);
