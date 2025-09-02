
'use server';
/**
 * @fileOverview A flow for fetching commodity prices from the MarketData API,
 * calculating the UCS Index, and saving both to Firestore.
 * This flow can be run for all commodities (by a scheduled job) or for a single one (manual trigger).
 *
 * - fetchAndSavePricesFlow - The main flow executed.
 * - FetchAndSavePricesInputSchema - The input for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMarketDataQuote } from '@/lib/marketdata-service';
import { saveCommodityData, saveUcsIndexData } from '@/lib/database-service';
import { getCommodityConfig } from '@/lib/commodity-config-service';
import { calculateUcsIndex } from './calculate-ucs-index-flow';
import type { CommodityPriceData } from '@/lib/types';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';


const FetchAndSavePricesInputSchema = z.object({
    assetName: z.string().optional().describe('The name of a single asset to update. If not provided, all assets will be updated.'),
});

const FetchAndSaveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  savedCount: z.number(),
  calculatedIndex: z.number().optional(),
});


// This is the main function that can be called by the scheduled job or manually.
export const fetchAndSavePricesFlow = ai.defineFlow(
  {
    name: 'fetchAndSavePricesFlow',
    inputSchema: FetchAndSavePricesInputSchema,
    outputSchema: FetchAndSaveOutputSchema,
  },
  async ({ assetName }) => {
    try {
      console.log(`[FLOW] Starting data processing... Mode: ${assetName ? `Single asset (${assetName})` : 'All assets'}`);
      
      const { commodityMap } = await getCommodityConfig();
      let fetchedPrices: CommodityPriceData[] = [];
      const assetsToUpdate = assetName ? [assetName] : Object.keys(commodityMap);

      // 1. Fetch latest commodity prices
      for (const name of assetsToUpdate) {
          try {
            const commodityInfo = commodityMap[name];
            if (!commodityInfo) {
                console.warn(`[FLOW] Asset ${name} not found in config. Skipping.`);
                continue;
            }
            
            const quote = await getMarketDataQuote(commodityInfo.ticker);
             if (!quote || typeof quote.last === 'undefined') {
                console.warn(`[FLOW] API response for ${name} is invalid. Skipping.`);
                continue;
            }
            
            const newPrice = quote.last;
            
            // Get last saved price to calculate change
            const pricesCollectionRef = collection(db, 'commodities_history', name, 'price_entries');
            const q = query(pricesCollectionRef, orderBy('savedAt', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);
            let lastPrice = newPrice;
            if (!querySnapshot.empty) {
                lastPrice = querySnapshot.docs[0].data().price;
            }

            const absoluteChange = newPrice - lastPrice;
            const change = lastPrice !== 0 ? (absoluteChange / lastPrice) * 100 : 0;
            
            fetchedPrices.push({
                id: '', // Firestore generates
                name: name,
                ticker: commodityInfo.ticker,
                price: newPrice,
                change,
                absoluteChange,
                lastUpdated: new Date().toISOString(),
                currency: commodityInfo.currency,
            });
          } catch (error) {
              console.error(`[FLOW] Failed to fetch price for ${name}. Skipping.`, error);
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
