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
import type { CommodityPriceData } from '@/lib/types';


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
    const commodityNames = ['Créditos de Carbono', 'Boi Gordo', 'Milho', 'Soja', 'Madeira', 'Água'];
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });


    // Formula weights based on the user's spreadsheet
    const weights = {
        agropecuaria: 0.15,
        madeira: 0.68,
        agua: 0.14,
        carbono: 0.02,
    };
    
    // Placeholder for sub-component weights within agropecuaria (can be refined later)
    const agroWeights = {
        boiGordo: 0.35,
        milho: 0.30,
        soja: 0.35,
    };

    // Calculate the value for each main component
    const agroValue = (prices['Boi Gordo'] * agroWeights.boiGordo +
                       prices['Milho'] * agroWeights.milho +
                       prices['Soja'] * agroWeights.soja);

    const madeiraValue = prices['Madeira'];
    const aguaValue = prices['Água'];
    const carbonoValue = prices['Créditos de Carbono'];
    
    // This is a simplified weighted sum.
    // The formula from the spreadsheet seems to imply a much more complex calculation
    // involving rentability per hectare and other factors.
    // For now, we use this weighted sum as a starting point.
    // A more complex implementation would require a dedicated flow to replicate the spreadsheet logic.
    const totalValue = 
        (agroValue * weights.agropecuaria) +
        (madeiraValue * weights.madeira) +
        (aguaValue * weights.agua) +
        (carbonoValue * weights.carbono);

    // The final index seems to be normalized. We'll use a placeholder divisor
    // based on typical index values to get a result around 100.
    // This should be replaced with the official normalization factor.
    const normalizationFactor = 10; // Placeholder
    const indexValue = totalValue / normalizationFactor;

    return { indexValue: parseFloat(indexValue.toFixed(2)) };
  }
);
