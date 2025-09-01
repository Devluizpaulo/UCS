'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the Yahoo Finance API and saving them to Firestore.
 * This flow is intended to be run by a scheduled job.
 *
 * - fetchAndSavePrices - Fetches the latest commodity prices and saves them to the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getOptimizedCommodityPrices } from '@/lib/yahoo-finance-optimizer';
import { saveCommodityData } from '@/lib/database-service';
import { COMMODITY_TICKER_MAP } from '@/lib/yahoo-finance-config-data';


const FetchAndSaveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  savedCount: z.number(),
});

async function fetchAndSavePrices(): Promise<z.infer<typeof FetchAndSaveOutputSchema>> {
  try {
    const commodityNames = Object.keys(COMMODITY_TICKER_MAP);
    console.log('[FLOW] Starting daily commodity price fetch...');
    console.log(`[FLOW] Fetching prices for: ${commodityNames.join(', ')}`);

    const prices = await getOptimizedCommodityPrices(commodityNames);

    if (!prices || prices.length === 0) {
      console.error('[FLOW] Failed to fetch any prices from the external API.');
      return { success: false, message: 'Failed to fetch prices from API.', savedCount: 0 };
    }
    
    console.log(`[FLOW] Fetched ${prices.length} prices. Saving to database...`);
    await saveCommodityData(prices);
    console.log('[FLOW] Successfully fetched and saved commodity prices.');

    return { success: true, message: 'Commodity prices updated successfully.', savedCount: prices.length };

  } catch (error) {
    console.error('[FLOW] An unexpected error occurred:', error);
    return { success: false, message: 'Internal Server Error', savedCount: 0 };
  }
}

// Define the flow for use by the scheduled job.
export const fetchAndSavePricesFlow = ai.defineFlow(
  {
    name: 'fetchAndSavePricesFlow',
    outputSchema: FetchAndSaveOutputSchema,
  },
  fetchAndSavePrices
);
