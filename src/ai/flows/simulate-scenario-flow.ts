

'use server';
/**
 * @fileOverview A flow for simulating the impact of price changes on the UCS Index.
 *
 * - simulateScenario - Runs a simulation and returns the projected index value.
 * - SimulateScenarioInput - The input type for the simulateScenario function.
 * - SimulateScenarioOutput - The return type for the simulateScenario function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getCommodityPrices } from '@/lib/data-service';
import type { ScenarioResult, SimulateScenarioInput } from '@/lib/types';
import { getFormulaParameters } from '@/lib/formula-service';
import { calculateIndex } from '@/lib/calculation-service';


const SimulateScenarioInputSchema = z.object({
    asset: z.string(),
    changeType: z.enum(['percentage', 'absolute']),
    value: z.number(),
}) satisfies z.ZodType<SimulateScenarioInput>;

const SimulateScenarioOutputSchema = z.object({
    newIndexValue: z.number(),
    originalIndexValue: z.number(),
    changePercentage: z.number(),
    originalAssetPrice: z.number(),
}) satisfies z.ZodType<ScenarioResult>;


export async function simulateScenario(input: SimulateScenarioInput): Promise<ScenarioResult> {
    const simulateScenarioFlow = ai.defineFlow(
      {
        name: 'simulateScenarioFlow',
        inputSchema: SimulateScenarioInputSchema,
        outputSchema: SimulateScenarioOutputSchema,
      },
      async ({ asset, changeType, value }) => {
        // 1. Get current market prices and formula parameters
        const [pricesData, params] = await Promise.all([
            getCommodityPrices(),
            getFormulaParameters()
        ]);
        
        if (!params.isConfigured) {
            throw new Error("Cannot run simulation because the index formula has not been configured.");
        }
        
        // Get the unconverted original price to show the user
        const originalAssetPrice = pricesData.find(p => p.name === asset)?.price || 0;

        // 2. Calculate the original index value using the pure function
        const originalIndexResult = calculateIndex(pricesData, params);
        const originalIndexValue = originalIndexResult.indexValue;

        // 3. Create the new set of prices based on the scenario
        const simulatedPricesData = pricesData.map(p => {
            if (p.name === asset) {
                const newPrice = changeType === 'percentage' 
                    ? p.price * (1 + value / 100)
                    : value;
                return { ...p, price: newPrice };
            }
            return p;
        });
       
        // 4. Calculate the new index value using the pure function
        const newIndexResult = calculateIndex(simulatedPricesData, params);
        const newIndexValue = newIndexResult.indexValue;

        // 5. Calculate the percentage change
        const changePercentage = originalIndexValue === 0 ? 0 : ((newIndexValue - originalIndexValue) / originalIndexValue) * 100;

        return {
            newIndexValue: parseFloat(newIndexValue.toFixed(2)),
            originalIndexValue: parseFloat(originalIndexValue.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(2)),
            originalAssetPrice: parseFloat(originalAssetPrice.toFixed(4)),
        };
      }
    );

    return await simulateScenarioFlow(input);
}
