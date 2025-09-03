
'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the MarketData API,
 * calculating the UCS Index, and saving both to Firestore.
 * This flow can be run for all commodities (by a scheduled job) or for a single one (manual trigger).
 *
 * - fetchAndSavePrices - The main flow function..
 * - FetchAndSavePricesInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMarketDataQuote } from '@/lib/marketdata-service';
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
        const apiKey = process.env.MARKETDATA_API_KEY;
        if (!apiKey) {
            const errorMessage = "A chave da API MarketData não está configurada no ambiente do servidor. Verifique o arquivo .env.";
            console.error(`[FLOW ERROR] ${errorMessage}`);
            return { success: false, message: errorMessage, savedCount: 0 };
        }

        console.log(`[FLOW] Starting data processing... Mode: ${assetName ? `Single asset (${assetName})` : 'All assets'}`);
        
        const allCommodities = await getCommodities();
        const assetsToUpdate = assetName 
          ? allCommodities.filter(c => c.name === assetName) 
          : allCommodities;

        if (assetsToUpdate.length === 0) {
          return { success: false, message: `Asset '${assetName}' not found.`, savedCount: 0 };
        }
        
        // Fetch all prices in parallel for performance
        const pricePromises = assetsToUpdate.map(async (commodityInfo) => {
            try {
              const newPrice = await getMarketDataQuote(apiKey, commodityInfo.ticker);
              return {
                  ...commodityInfo,
                  price: newPrice,
                  lastUpdated: new Date().toISOString(),
                  change: 0, 
                  absoluteChange: 0,
              } as CommodityPriceData;
            } catch (error: any) {
                console.error(`[FLOW] Failed to fetch price for ${commodityInfo.name} (${commodityInfo.ticker}). Skipping. Error: ${error.message}`);
                return null; // Return null on failure to filter out later
            }
        });

        const fetchedPricesResults = await Promise.all(pricePromises);
        const fetchedPrices = fetchedPricesResults.filter((p): p is CommodityPriceData => p !== null);
        
        if (fetchedPrices.length === 0) {
          console.error('[FLOW ERROR] No prices could be fetched for the selected assets.');
          return { success: false, message: 'Failed to fetch any prices.', savedCount: 0 };
        }

        console.log(`[FLOW] Fetched ${fetchedPrices.length} prices. Saving to database...`);

        // 2. Save the fetched commodity prices to Firestore
        await saveCommodityData(fetchedPrices);
        console.log('[FLOW] Successfully saved commodity prices.');

        // 3. Calculate the UCS Index using the latest data in the database
        console.log('[FLOW] Calculating UCS Index value...');
        const ucsResult = await calculateUcsIndex();

        // 4. Save the new UCS Index value. If the formula is not configured, this will save a value of 0.
        await saveUcsIndexData(ucsResult);
        console.log(`[FLOW] Successfully calculated and saved UCS Index value: ${ucsResult.indexValue}`);

        const message = assetName 
          ? `${assetName} foi atualizado e o índice recalculado.`
          : 'Cotações e Índice UCS atualizados com sucesso.';

        return {
          success: true,
          message,
          savedCount: fetchedPrices.length,
          calculatedIndex: ucsResult.indexValue,
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
