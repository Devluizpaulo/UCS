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
import { getOptimizedCommodityPrices } from '@/lib/yahoo-finance-optimizer';
import type { CommodityPriceData } from '@/lib/types';
import { saveCommodityData } from '@/lib/database-service';

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
    const prices = await getOptimizedCommodityPrices(input.commodities);
    
    // Asynchronously save the fetched data to Firestore without blocking the response
    if (prices && prices.length > 0) {
        saveCommodityData(prices).catch(error => {
            console.error('[LOG] Failed to save commodity data to Firestore:', error);
        });
    }
    
    return prices;
}


// Keep the flow for backward compatibility, but use optimized function
const getCommodityPricesFlow = ai.defineFlow(
  {
    name: 'getCommodityPricesFlow',
    inputSchema: CommodityPricesInputSchema,
    outputSchema: CommodityPricesOutputSchema,
  },
  async (input) => {
    try {
      const prices = await getCommodityPrices(input);
      return { prices };
    } catch (error) {
      console.error('[LOG] Error fetching from Yahoo Finance API:', error);
      return { prices: [] };
    }
  }
);
