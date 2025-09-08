
'use server';
/**
 * @fileOverview A flow to fetch latest commodity prices and save them to Firestore.
 * This flow simulates the n8n workflow for manual testing and updates.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCommodities } from '@/lib/commodity-config-service';
import { fetchLatestPrice } from '@/lib/marketdata-service';
import { saveLatestQuotes } from '@/lib/data-service';

const UpdatePricesOutputSchema = z.array(z.object({
    name: z.string(),
    price: z.number(),
}));

/**
 * Fetches the latest prices for all configured commodities and saves them to the
 * 'cotacoes_do_dia' collection in Firestore.
 */
export async function fetchAndSavePricesFlow(): Promise<z.infer<typeof UpdatePricesOutputSchema>> {
  const updatePricesFlow = ai.defineFlow(
    {
      name: 'fetchAndSavePricesFlow',
      inputSchema: z.void(),
      outputSchema: UpdatePricesOutputSchema,
    },
    async () => {
      console.log('[Flow] Starting price update flow...');
      const commodities = await getCommodities();
      
      const priceFetchPromises = commodities.map(async (comm) => {
        try {
          const quote = await fetchLatestPrice(comm.ticker);
          return {
            ativo: comm.name,
            data: new Date().toLocaleDateString('pt-BR'),
            abertura: quote.open,
            maxima: quote.high,
            minima: quote.low,
            ultimo: quote.last,
            fechamento: quote.last, // Assuming last is the closing price for simplicity
            moeda: comm.currency,
            fonte: 'marketdata-service'
          };
        } catch (error) {
          console.error(`[Flow] Failed to fetch price for ${comm.name} (${comm.ticker}):`, error);
          return null; // Return null for failed fetches
        }
      });

      const quotes = (await Promise.all(priceFetchPromises)).filter(q => q !== null);

      if (quotes.length > 0) {
        await saveLatestQuotes(quotes as any[]);
        console.log(`[Flow] Successfully saved ${quotes.length} quotes to Firestore.`);
      }

      return quotes.map(q => ({ name: q!.ativo, price: q!.ultimo }));
    }
  );

  return await updatePricesFlow();
}
