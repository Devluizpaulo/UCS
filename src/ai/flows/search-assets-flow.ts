
'use server';
/**
 * @fileOverview A flow for searching assets on the MarketData API.
 *
 * - searchAssetsFlow - Searches for assets based on a query.
 * - SearchAssetsInput - The input type for the flow.
 * - SearchAssetsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchMarketDataAssets } from '@/lib/marketdata-service';

const SearchAssetsInputSchema = z.object({
  query: z.string().describe('The search term for assets.'),
});

const SearchedAssetSchema = z.object({
    symbol: z.string(),
    description: z.string(),
    country: z.string(),
});

const SearchAssetsOutputSchema = z.array(SearchedAssetSchema);

export async function searchAssetsFlow(
  input: z.infer<typeof SearchAssetsInputSchema>
): Promise<z.infer<typeof SearchAssetsOutputSchema>> {
  const searchFlow = ai.defineFlow(
    {
      name: 'searchAssetsFlow',
      inputSchema: SearchAssetsInputSchema,
      outputSchema: SearchAssetsOutputSchema,
    },
    async ({ query }) => {
      console.log(`[FLOW] Searching for assets with query: "${query}"`);
      const results = await searchMarketDataAssets(query);
      console.log(`[FLOW] Found ${results.length} assets.`);
      return results;
    }
  );

  return await searchFlow(input);
}
