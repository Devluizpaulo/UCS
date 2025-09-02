
'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the MarketData API,
 * calculating the UCS Index, and saving both to Firestore.
 * This flow is intended to be run by a scheduled job.
 *
 * - fetchAndSavePricesFlow - The main flow executed by the scheduled job.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMarketDataCandles } from '@/lib/marketdata-service';
import { saveCommodityData, saveUcsIndexData } from '@/lib/database-service';
import { getCommodityConfig } from '@/lib/commodity-config-service';
import { calculateUcsIndex } from './calculate-ucs-index-flow';


const FetchAndSaveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  savedCount: z.number(),
  calculatedIndex: z.number().optional(),
});


// This is the main function that will be called by the scheduled job.
export const fetchAndSavePricesFlow = ai.defineFlow(
  {
    name: 'fetchAndSavePricesFlow',
    outputSchema: FetchAndSaveOutputSchema,
  },
  async () => {
    try {
      const { commodityMap } = await getCommodityConfig();
      const commodityNames = Object.keys(commodityMap);
      console.log('[FLOW] Starting daily data processing...');
      console.log(`[FLOW] Fetching prices for: ${commodityNames.join(', ')}`);

      // 1. Fetch latest commodity prices from external API
      const prices = await getMarketDataCandles(commodityNames);

      if (!prices || prices.length === 0) {
        console.error('[FLOW] Failed to fetch any prices from the external API.');
        return { success: false, message: 'Failed to fetch prices from API.', savedCount: 0 };
      }
      
      console.log(`[FLOW] Fetched ${prices.length} prices. Saving to database...`);
      
      // 2. Save the fetched commodity prices to Firestore
      await saveCommodityData(prices);
      console.log('[FLOW] Successfully saved commodity prices.');
      
      // 3. Calculate the UCS Index using the newly fetched prices
      console.log('[FLOW] Calculating UCS Index value...');
      const ucsResult = await calculateUcsIndex();
      
      let calculatedIndexValue: number | undefined;
      // 4. Save the new UCS Index value if the formula is configured
      if (ucsResult.isConfigured) {
        await saveUcsIndexData(ucsResult.indexValue);
        calculatedIndexValue = ucsResult.indexValue;
        console.log(`[FLOW] Successfully calculated and saved UCS Index value: ${ucsResult.indexValue}`);
      } else {
        console.log('[FLOW] UCS Index not calculated because formula is not configured.');
      }

      return { 
          success: true, 
          message: 'Commodity prices and UCS Index updated successfully.', 
          savedCount: prices.length,
          calculatedIndex: calculatedIndexValue
      };

    } catch (error) {
      console.error('[FLOW] An unexpected error occurred during the daily job:', error);
      return { success: false, message: 'Internal Server Error', savedCount: 0 };
    }
  }
);
