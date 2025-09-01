
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
import { getCommodityPrices } from '@/lib/data-service';
import type { ScenarioResult, SimulateScenarioInput, FormulaParameters } from '@/lib/types';
import { getFormulaParameters } from '@/lib/formula-service';


const SimulateScenarioOutputSchema = z.object({
    newIndexValue: z.number(),
    originalIndexValue: z.number(),
    changePercentage: z.number(),
    originalAssetPrice: z.number(),
}) satisfies z.ZodType<ScenarioResult>;

export async function simulateScenario(input: SimulateScenarioInput): Promise<ScenarioResult> {
  return await simulateScenarioFlow(input);
}

// Helper function to calculate the index based on the new methodology.
function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): number {
    
    // Exchange Rates
    const taxa_usd_brl = prices['USD/BRL Histórico'] || 1;
    const taxa_eur_brl = prices['EUR/BRL Histórico'] || 1;

    // Prices (raw from API)
    const preco_lumber_mbf = prices['Madeira Futuros'] || 0; // Price per 1,000 board feet
    const preco_boi_arroba = prices['Boi Gordo Futuros - Ago 25 (BGIc1)'] || 0; // Price in BRL/@
    const preco_milho_bushel_cents = prices['Milho Futuros'] || 0; // Price in USD cents per bushel
    const preco_soja_bushel_cents = prices['Soja Futuros'] || 0; // Price in USD cents per bushel
    const preco_carbono_eur = prices['Carbono Futuros'] || 0; // Price in EUR/tCO₂

    // --- Price Conversions ---
    const preco_madeira_serrada_m3 = (preco_lumber_mbf / 1000) * 424 * taxa_usd_brl;
    const preco_madeira_tora_m3 = preco_madeira_serrada_m3 * params.FATOR_CONVERSAO_SERRADA_TORA;
    const preco_milho_ton = (preco_milho_bushel_cents / 100) * (1000 / 25.4) * taxa_usd_brl;
    const preco_soja_ton = (preco_soja_bushel_cents / 100) * (1000 / 27.2) * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
    
    // --- Formula Calculation ---
    const VM = preco_madeira_tora_m3 * params.VOLUME_MADEIRA_HA;
    const renda_bruta_ha = (params.PROD_BOI * preco_boi_arroba * params.PESO_PEC) + 
                           (params.PROD_MILHO * preco_milho_ton * params.PESO_MILHO) + 
                           (params.PROD_SOJA * preco_soja_ton * params.PESO_SOJA);
    const VUS = renda_bruta_ha / params.FATOR_ARREND;
    const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIRA_HA * params.FATOR_CARBONO;
    const valor_agua = VUS * params.FATOR_AGUA;
    const CRS = valor_carbono + valor_agua;
    const ucsValue = VM + VUS + CRS;

    return isFinite(ucsValue) ? ucsValue : 0;
}


const simulateScenarioFlow = ai.defineFlow(
  {
    name: 'simulateScenarioFlow',
    inputSchema: z.object({
        asset: z.string(),
        changeType: z.enum(['percentage', 'absolute']),
        value: z.number(),
    }) satisfies z.ZodType<SimulateScenarioInput>,
    outputSchema: SimulateScenarioOutputSchema,
  },
  async ({ asset, changeType, value }) => {
    // 1. Get current market prices and formula parameters
    const [pricesData, params] = await Promise.all([
        getCommodityPrices(),
        getFormulaParameters()
    ]);
    
    const originalPrices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        // Here we use the raw prices from the API, conversion happens inside calculateIndex
        acc[item.name] = item.price; 
        return acc;
    }, {} as { [key: string]: number });
    
    // Get the unconverted original price to show the user
    const originalAssetPrice = originalPrices[asset] || 0;

    // 2. Calculate the original index value
    const originalIndexValue = calculateIndex(originalPrices, params);

    // 3. Create the new set of prices based on the scenario
    const simulatedPrices = { ...originalPrices };
    if (changeType === 'percentage') {
        simulatedPrices[asset] = originalAssetPrice * (1 + value / 100);
    } else { // absolute
        simulatedPrices[asset] = value;
    }

    // 4. Calculate the new index value
    const newIndexValue = calculateIndex(simulatedPrices, params);

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
