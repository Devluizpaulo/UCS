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
    'Agua Futuros',
];

// Helper function to calculate the index based on the new methodology.
function calculateIndex(prices: { [key: string]: number }): number {
    // Constants from the formula
    const Vmad = 0; // Per formula, Vmad = 0
    const FAmed = 0.048; // Fator de Arrendamento médio
    const FP_pecuari = 0.35;
    const FP_milho = 0.3;
    const FP_soja = 0.35;
    const Pmed = 1; // Assuming Produção média por hectare = 1 for simplicity
    const AtCO2n = 2.59; // Unidades de Cc por Hectare
    const FCH2O = 0.07; // Fator de Conversão da água
    const CE = 2.59; // Carbono estocado em equivalência à tCo2

    // Prices
    const C_pecuari = prices['Boi Gordo Futuros'] || 0;
    const C_milho = prices['Milho Futuros'] || 0;
    const C_soja = prices['Soja Futuros'] || 0;
    const Ccc = prices['Carbono Futuros'] || 0;
    const Ch2o_price = prices['Agua Futuros'] || 0;

    // Intermediate Calculations
    const Vus_sum_part = (FP_pecuari * Pmed * C_pecuari) + (FP_milho * Pmed * C_milho) + (FP_soja * Pmed * C_soja);
    const Vus = Vus_sum_part * FAmed;
    
    const Cc = Ccc * AtCO2n;
    const CH2O = Ch2o_price * FCH2O;
    const CRS = Cc + CH2O;
    
    // PDM = Potencial Desflorestador Monetizado
    const PDM = Vmad + Vus + CRS;

    // IVP = Índice de Viabilidade de Projeto
    const IVP = (PDM / CE) / 2;

    // UCS (CF) = Unidade de Crédito de Sustentabilidade
    const ucsValue = 2 * IVP;
    
    return isFinite(ucsValue) ? ucsValue : 0;
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
        let priceInBrl = item.price;
         if (item.name === 'Soja Futuros' || item.name === 'Madeira Futuros' || item.name === 'Agua Futuros') { // USD assets
            const usdRate = pricesData.find(p => p.name === 'USD/BRL Histórico')?.price || 1;
            priceInBrl = item.price * usdRate;
        } else if (item.name === 'Carbono Futuros') { // EUR asset
            const eurRate = pricesData.find(p => p.name === 'EUR/BRL Histórico')?.price || 1;
            priceInBrl = item.price * eurRate;
        }
        acc[item.name] = priceInBrl;
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
