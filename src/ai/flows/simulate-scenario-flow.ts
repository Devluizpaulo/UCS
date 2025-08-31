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

const commodityNames = [
    'USD/BRL Histórico',
    'EUR/BRL Histórico',
    'Boi Gordo Futuros',
    'Soja Futuros',
    'Milho Futuros',
    'Madeira Futuros',
    'Carbono Futuros',
];
const commoditiesForIndex = commodityNames.filter(name => !name.includes('/BRL'));

// Helper function to calculate the index.
function calculateIndex(prices: { [key: string]: number }): number {
    const weight = 1 / commoditiesForIndex.length;
    
    const totalValue = commoditiesForIndex.reduce((sum, name) => {
        return sum + ((prices[name] || 0) * weight);
    }, 0);

    const normalizationFactor = 1; // Adjusted for currency pair scale
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
    const changePercentage = originalIndexValue === 0 ? 0 : ((newIndexValue - originalIndexValue) / originalIndexValue) * 100;

    return {
        newIndexValue: parseFloat(newIndexValue.toFixed(4)),
        originalIndexValue: parseFloat(originalIndexValue.toFixed(4)),
        changePercentage: parseFloat(changePercentage.toFixed(2)),
        originalAssetPrice: parseFloat(originalAssetPrice.toFixed(4)),
    };
  }
);
