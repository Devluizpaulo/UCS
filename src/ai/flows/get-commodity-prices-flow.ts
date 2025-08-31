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
const commodityTickerMap: { [key: string]: string } = {
  'USD/BRL Histórico': 'BRL=X',
  'EUR/BRL Histórico': 'EURBRL=X',
  'Boi Gordo Futuros': 'BGI=F',
};

const getCommodityPricesFlow = ai.defineFlow(
  {
    name: 'getCommodityPricesFlow',
    inputSchema: CommodityPricesInputSchema,
    outputSchema: CommodityPricesOutputSchema,
  },
  async (input) => {
    const tickers = input.commodities
      .map((name) => commodityTickerMap[name])
      .filter(Boolean);

    if (tickers.length === 0) {
      return { prices: [] };
    }

    try {
      const quotes = await yahooFinance.quote(tickers);

      const prices = quotes.map((quote) => {
        const commodityName =
          Object.keys(commodityTickerMap).find(
            (key) => commodityTickerMap[key] === quote.symbol
          ) || quote.symbol;

        // Use BRL for currencies, otherwise use the quote currency
        let price = quote.regularMarketPrice ?? 0;
        let change = quote.regularMarketChangePercent ?? 0;
        let absoluteChange = quote.regularMarketChange ?? 0;

        const lastUpdated = quote.regularMarketTime ? 
            new Date(quote.regularMarketTime * 1000).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'N/A';
        
        return {
          name: commodityName,
          ticker: quote.symbol,
          price: parseFloat(price.toFixed(4)),
          change: parseFloat(change.toFixed(2)),
          absoluteChange: parseFloat(absoluteChange.toFixed(4)),
          lastUpdated: `Às ${lastUpdated} (GMT-3)`,
        };
      });

      return { prices };
    } catch (error) {
      console.error('[LOG] Error fetching from Yahoo Finance API:', error);
      // Fallback or error handling: return an empty list to prevent crashes.
      return { prices: [] };
    }
  }
);
