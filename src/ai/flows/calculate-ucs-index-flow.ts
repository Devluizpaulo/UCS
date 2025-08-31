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
    const commodityNames = ['Soja Futuros', 'USD/BRL Histórico', 'EUR/BRL Histórico'];
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });

    // Assuming equal weights for the new components for simplicity.
    // This can be adjusted based on a new formula.
    const weights = {
        'Soja Futuros': 1/3,
        'USD/BRL Histórico': 1/3,
        'EUR/BRL Histórico': 1/3,
    };
    
    const totalValue = 
        (prices['Soja Futuros'] * weights['Soja Futuros']) +
        (prices['USD/BRL Histórico'] * weights['USD/BRL Histórico']) +
        (prices['EUR/BRL Histórico'] * weights['EUR/BRL Histórico']);

    // A simple normalization factor, can be adjusted.
    const normalizationFactor = 4; // Placeholder
    const indexValue = totalValue / normalizationFactor;

    return { indexValue: parseFloat(indexValue.toFixed(2)) };
  }
);
