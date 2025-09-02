
'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the MarketData API,
 * calculating the UCS Index, and saving both to Firestore.
 * This flow can be run for all commodities (by a scheduled job) or for a single one (manual trigger).
 *
 * - fetchAndSavePrices - The main flow function.
 * - FetchAndSavePricesInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMarketDataHistory } from '@/lib/marketdata-service';
import { saveCommodityData, saveUcsIndexData } from '@/lib/database-service';
import { getCommodities } from '@/lib/commodity-config-service';
import { calculateUcsIndex } from './calculate-ucs-index-flow';
import type { CommodityPriceData } from '@/lib/types';


const FetchAndSavePricesInputSchema = z.object({
    assetName: z.string().optional().describe('The name of a single asset to update. If not provided, all assets will be updated.'),
});

const FetchAndSaveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  savedCount: z.number(),
  calculatedIndex: z.number().optional(),
});


export async function fetchAndSavePrices(input: z.infer<typeof FetchAndSavePricesInputSchema>): Promise<z.infer<typeof FetchAndSaveOutputSchema>> {
  const fetchAndSavePricesFlow = ai.defineFlow(
    {
      name: 'fetchAndSavePricesFlow',
      inputSchema: FetchAndSavePricesInputSchema,
      outputSchema: FetchAndSaveOutputSchema,
    },
    async ({ assetName }) => {
      try {
        console.log(`[FLOW] Starting data processing... Mode: ${assetName ? `Single asset (${assetName})` : 'All assets'}`);
        
        const allCommodities = await getCommodities();
        const assetsToUpdate = assetName 
          ? allCommodities.filter(c => c.name === assetName) 
          : allCommodities;

        if (assetsToUpdate.length === 0) {
          return { success: false, message: `Asset '${assetName}' not found.`, savedCount: 0 };
        }
        
        let fetchedPrices: CommodityPriceData[] = [];

        for (const commodityInfo of assetsToUpdate) {
            try {
              // Get last day's closing price
              const history = await getMarketDataHistory(commodityInfo.ticker, 'D', 2);
              if (history.s !== 'ok' || history.c.length === 0) {
                  console.warn(`[FLOW] API response for ${commodityInfo.name} is invalid or has no data. Skipping.`);
                  continue;
              }

              const newPrice = history.c[history.c.length - 1]; // Get the most recent closing price
              
              fetchedPrices.push({
                  ...commodityInfo,
                  price: newPrice,
                  lastUpdated: new Date().toISOString(),
                  // Placeholder values, will be calculated on read
                  change: 0, 
                  absoluteChange: 0,
              });
            } catch (error) {
                console.error(`[FLOW] Failed to fetch price for ${commodityInfo.name}. Skipping.`, error);
            }
        }
        
        if (fetchedPrices.length === 0) {
          return { success: false, message: 'Failed to fetch any prices.', savedCount: 0 };
        }

        console.log(`[FLOW] Fetched ${fetchedPrices.length} prices. Saving to database...`);

        // 2. Save the fetched commodity prices to Firestore
        await saveCommodityData(fetchedPrices);
        console.log('[FLOW] Successfully saved commodity prices.');

        // 3. Calculate the UCS Index using the latest data in the database
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

        console.log('[FLOW] Cotações e Índice UCS atualizados com sucesso.');

        const message = assetName 
          ? `${assetName} foi atualizado e o índice recalculado.`
          : 'Cotações e Índice UCS atualizados com sucesso.';

        return {
          success: true,
          message,
          savedCount: fetchedPrices.length,
          calculatedIndex: calculatedIndexValue,
        };

      } catch (error) {
        console.error(`[FLOW] An unexpected error occurred during data processing:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return { success: false, message: errorMessage, savedCount: 0 };
      }
    }
  );

  return await fetchAndSavePricesFlow(input);
}
