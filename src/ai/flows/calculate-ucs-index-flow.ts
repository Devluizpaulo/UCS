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
        'Soja Futuros',
        'USD/BRL Histórico',
        'EUR/BRL Histórico',
        'Boi Gordo Futuros',
        'Milho Futuros',
        'Madeira Futuros',
        'Carbono Futuros'
    ];
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });

    // Assuming equal weights for simplicity.
    const weight = 1 / commodityNames.length;
    
    const totalValue = commodityNames.reduce((sum, name) => {
        return sum + (prices[name] * weight);
    }, 0);

    // A simple normalization factor, can be adjusted.
    const normalizationFactor = 10; // Placeholder
    const indexValue = totalValue / normalizationFactor;

    return { indexValue: parseFloat(indexValue.toFixed(2)) };
  }
);
