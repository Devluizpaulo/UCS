'use server';
/**
 * @fileOverview A flow for calculating the UCS Index based on real-time commodity prices.
 *
 * - calculateUcsIndex - Calculates the final UCS index value.
 * - CalculateUcsIndexOutput - The return type for the calculateUcsIndex function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCommodityPrices } from './get-commodity-prices-flow';

const CalculateUcsIndexOutputSchema = z.object({
  indexValue: z.number().describe('The calculated value of the UCS Index.'),
});
export type CalculateUcsIndexOutput = z.infer<typeof CalculateUcsIndexOutputSchema>;

export async function calculateUcsIndex(): Promise<CalculateUcsIndexOutput> {
  return await calculateUcsIndexFlow();
}

const calculateUcsIndexFlow = ai.defineFlow(
  {
    name: 'calculateUcsIndexFlow',
    outputSchema: CalculateUcsIndexOutputSchema,
  },
  async () => {
    const commodityNames = [
        'USD/BRL Histórico',
        'EUR/BRL Histórico',
    ];
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    // If no price data is returned (e.g., API error), return a default value to avoid a crash.
    if (!pricesData || pricesData.length === 0) {
      console.error('[LOG] No commodity prices received. Returning default index value.');
      return { indexValue: 0 };
    }

    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });

    // Check if all commodities have a price.
    const hasAllPrices = commodityNames.every(name => prices[name] !== undefined);
    if (!hasAllPrices) {
        console.error('[LOG] Missing some commodity prices. Calculation might be inaccurate.');
        // Return 0 if any price is missing to prevent calculation with NaN.
        return { indexValue: 0 };
    }


    // Assuming equal weights for simplicity.
    const weight = 1 / commodityNames.length;
    
    const totalValue = commodityNames.reduce((sum, name) => {
        return sum + (prices[name] * weight);
    }, 0);

    // A simple normalization factor, can be adjusted.
    const normalizationFactor = 1; // Adjusted for currency pair scale
    const indexValue = totalValue / normalizationFactor;

    return { indexValue: parseFloat(indexValue.toFixed(4)) };
  }
);
