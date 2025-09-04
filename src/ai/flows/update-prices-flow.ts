'use server';
/**
 * @fileOverview This flow is responsible for fetching the latest prices for all configured
 * commodities from Yahoo Finance. It is designed to be called from the manual
 * update page to stage prices for user review before saving.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCommodities } from '@/lib/commodity-config-service';
import { getYahooFinanceQuote } from '@/lib/marketdata-service';
import type { CommodityPriceData } from '@/lib/types';


// Defines the structure of the data returned by the flow.
// This data is staged for review on the "Update Prices" page.
const StagedPriceSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  currency: z.string(),
  category: z.string(),
  unit: z.string(),
  description: z.string(),
  price: z.number(),
  source: z.string().optional(),
});

const FetchPricesForReviewOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  prices: z.array(StagedPriceSchema),
});


export async function fetchPricesForReview(): Promise<z.infer<typeof FetchPricesForReviewOutputSchema>> {
  const fetchPricesForReviewFlow = ai.defineFlow(
    {
      name: 'fetchPricesForReviewFlow',
      inputSchema: z.void(),
      outputSchema: FetchPricesForReviewOutputSchema,
    },
    async () => {
      console.log('[Flow] Starting fetch-prices-for-review flow...');
      const commodities = await getCommodities();

      const pricePromises = commodities.map(async (commodity) => {
        try {
          const price = await getYahooFinanceQuote(commodity.ticker);
          return { ...commodity, price: price };
        } catch (error) {
          console.error(`[Flow] Failed to fetch price for ${commodity.name} (${commodity.ticker}):`, error);
          return { ...commodity, price: 0 }; // Return with price 0 on failure
        }
      });

      const settledPrices = await Promise.all(pricePromises);

      return {
        success: true,
        message: 'Preços buscados com sucesso para revisão.',
        prices: settledPrices,
      };
    }
  );

  return await fetchPricesForReviewFlow();
}
