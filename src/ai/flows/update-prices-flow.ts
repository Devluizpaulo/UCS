'use server';
/**
 * @fileOverview This flow is responsible for fetching the latest prices for all configured
 * commodities from the configured data provider (Yahoo Finance) and then saving
 * these prices to the Firestore database. It also triggers the recalculation of the UCS Index.
 *
 * This flow is designed to be called manually (e.g., from a button in the UI) or
 * by a scheduled job.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCommodities } from '@/lib/commodity-config-service';
import { getYahooFinanceQuote } from '@/lib/marketdata-service';
import { saveCommodityData, saveUcsIndexData } from '@/lib/database-service';
import type { CommodityPriceData } from '@/lib/types';
import { calculateUcsIndex } from './calculate-ucs-index-flow';

const FetchAndSavePricesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  updatedCount: z.number(),
  newIndexValue: z.number().optional(),
});

export async function fetchAndSavePrices() {
  const fetchAndSavePricesFlow = ai.defineFlow(
    {
      name: 'fetchAndSavePricesFlow',
      inputSchema: z.void(),
      outputSchema: FetchAndSavePricesOutputSchema,
    },
    async () => {
      console.log('[Flow] Starting fetch-and-save-prices flow...');
      const commodities = await getCommodities();

      // Fetch all prices in parallel for maximum efficiency
      const pricePromises = commodities.map(async (commodity) => {
        try {
          const price = await getYahooFinanceQuote(commodity.ticker);
          return { ...commodity, price: price };
        } catch (error) {
          console.error(`[Flow] Failed to fetch price for ${commodity.name} (${commodity.ticker}):`, error);
          // Return the commodity with price 0 so it's not excluded from the batch save,
          // ensuring its other data is still written to the DB.
          return { ...commodity, price: 0 };
        }
      });

      const settledPrices = await Promise.all(pricePromises);
      
      const pricesToSave: CommodityPriceData[] = settledPrices.map(p => ({
            ...p,
            change: 0, // Change is now calculated in the data-service layer from historical data
            absoluteChange: 0,
            lastUpdated: new Date().toISOString(),
      }));

      // Save all fetched prices to the database in a single batch
      await saveCommodityData(pricesToSave);
      console.log(`[Flow] Saved ${pricesToSave.length} commodity prices to the database.`);

      // After saving, recalculate the UCS index
      console.log('[Flow] Recalculating UCS Index...');
      const ucsResult = await calculateUcsIndex();
      await saveUcsIndexData(ucsResult);
      console.log(`[Flow] New UCS Index value (${ucsResult.indexValue}) saved.`);

      return {
        success: true,
        message: 'Preços atualizados e índice recalculado com sucesso.',
        updatedCount: pricesToSave.length,
        newIndexValue: ucsResult.indexValue,
      };
    }
  );

  return await fetchAndSavePricesFlow();
}
