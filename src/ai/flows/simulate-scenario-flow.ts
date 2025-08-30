'use server';
/**
 * @fileOverview A flow for simulating the impact of price changes on the UCS Index.
 *
 * - simulateScenario - Runs a simulation and returns the projected index value.
 * - SimulateScenarioInput - The input type for the simulateScenario function.
 * - SimulateScenarioOutput - The return type for the simulateScenario function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCommodityPrices } from './get-commodity-prices-flow';
import type { ScenarioResult } from '@/lib/types';


const SimulateScenarioInputSchema = z.object({
    asset: z.string().describe('The name of the commodity to change.'),
    changeType: z.enum(['percentage', 'absolute']).describe('The type of change to apply.'),
    value: z.number().describe('The value of the change (e.g., 10 for 10% or 250 for a new price).'),
});
export type SimulateScenarioInput = z.infer<typeof SimulateScenarioInputSchema>;

const SimulateScenarioOutputSchema = z.object({
    newIndexValue: z.number(),
    originalIndexValue: z.number(),
    changePercentage: z.number(),
    originalAssetPrice: z.number(),
}) satisfies z.ZodType<ScenarioResult>;

export async function simulateScenario(input: SimulateScenarioInput): Promise<ScenarioResult> {
  return await simulateScenarioFlow(input);
}

// Helper function to calculate the index. Replicated from calculate-ucs-index-flow to avoid circular dependency.
function calculateIndex(prices: { [key: string]: number }): number {
    const weights = {
        agropecuaria: 0.15,
        madeira: 0.68,
        agua: 0.14,
        carbono: 0.02,
    };
    const agroWeights = {
        boiGordo: 0.35,
        milho: 0.30,
        soja: 0.35,
    };
    const agroValue = (prices['Boi Gordo'] * agroWeights.boiGordo +
                       prices['Milho'] * agroWeights.milho +
                       prices['Soja'] * agroWeights.soja);

    const madeiraValue = prices['Madeira'];
    const aguaValue = prices['Água'];
    const carbonoValue = prices['Créditos de Carbono'];
    
    const totalValue = 
        (agroValue * weights.agropecuaria) +
        (madeiraValue * weights.madeira) +
        (aguaValue * weights.agua) +
        (carbonoValue * weights.carbono);

    const normalizationFactor = 10;
    return totalValue / normalizationFactor;
}


const simulateScenarioFlow = ai.defineFlow(
  {
    name: 'simulateScenarioFlow',
    inputSchema: SimulateScenarioInputSchema,
    outputSchema: SimulateScenarioOutputSchema,
  },
  async ({ asset, changeType, value }) => {
    // 1. Get current market prices
    const commodityNames = ['Créditos de Carbono', 'Boi Gordo', 'Milho', 'Soja', 'Madeira', 'Água'];
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    const originalPrices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });

    // 2. Calculate the original index value
    const originalIndexValue = calculateIndex(originalPrices);
    const originalAssetPrice = originalPrices[asset];

    // 3. Create the new set of prices based on the scenario
    const simulatedPrices = { ...originalPrices };
    if (changeType === 'percentage') {
        simulatedPrices[asset] = originalPrices[asset] * (1 + value / 100);
    } else { // absolute
        simulatedPrices[asset] = value;
    }

    // 4. Calculate the new index value
    const newIndexValue = calculateIndex(simulatedPrices);

    // 5. Calculate the percentage change
    const changePercentage = ((newIndexValue - originalIndexValue) / originalIndexValue) * 100;

    return {
        newIndexValue: parseFloat(newIndexValue.toFixed(2)),
        originalIndexValue: parseFloat(originalIndexValue.toFixed(2)),
        changePercentage: parseFloat(changePercentage.toFixed(2)),
        originalAssetPrice: parseFloat(originalAssetPrice.toFixed(2)),
    };
  }
);
