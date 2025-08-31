'use server';
/**
 * @fileOverview A flow for simulating the impact of price changes on the IVCF Index.
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

// Helper function to calculate the index based on the new methodology.
function calculateIndex(prices: { [key: string]: number }): number {
    // Constants from the formula
    const VOLUME_MADEIRA_HA = 120; // m³ de madeira comercial por hectare
    const FATOR_CARBONO = 2.59; // tCO₂ estocadas por m³ de madeira
    const PROD_BOI = 18; // Produção de arrobas de boi por ha/ano
    const PROD_MILHO = 7.2; // Produção de toneladas de milho por ha/ano
    const PROD_SOJA = 3.3; // Produção de toneladas de soja por ha/ano
    const PESO_PEC = 0.35; // Peso da pecuária no uso do solo
    const PESO_MILHO = 0.30; // Peso do milho no uso do solo
    const PESO_SOJA = 0.35; // Peso da soja no uso do solo
    const FATOR_ARREND = 0.048; // Fator de capitalização da renda
    const FATOR_AGUA = 0.07; // % do VUS que representa o valor da água
    const FATOR_CONVERSAO_MADEIRA = 0.3756; // Fator de conversão de madeira serrada para tora (em pé)

    // Exchange Rates
    const taxa_usd_brl = prices['USD/BRL Histórico'] || 1;
    const taxa_eur_brl = prices['EUR/BRL Histórico'] || 1;

    // Prices (raw from API)
    const preco_lumber_mbf = prices['Madeira Futuros'] || 0; // Price per 1,000 board feet
    const preco_boi_arroba = prices['Boi Gordo Futuros'] || 0; // Price in BRL/@
    const preco_milho_bushel_cents = prices['Milho Futuros'] || 0; // Price in USD cents per bushel
    const preco_soja_bushel_cents = prices['Soja Futuros'] || 0; // Price in USD cents per bushel
    const preco_carbono_eur = prices['Carbono Futuros'] || 0; // Price in EUR/tCO₂

    // --- Price Conversions ---
    const preco_madeira_serrada_m3 = (preco_lumber_mbf / 1000) * 424 * taxa_usd_brl;
    const preco_madeira_tora_m3 = preco_madeira_serrada_m3 * FATOR_CONVERSAO_MADEIRA;
    const preco_milho_ton = (preco_milho_bushel_cents / 100) * (1000 / 25.4) * taxa_usd_brl;
    const preco_soja_ton = (preco_soja_bushel_cents / 100) * (1000 / 27.2) * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
    
    // --- Formula Calculation ---
    const VM = preco_madeira_tora_m3 * VOLUME_MADEIRA_HA;
    const renda_bruta_ha = (PROD_BOI * preco_boi_arroba * PESO_PEC) + 
                           (PROD_MILHO * preco_milho_ton * PESO_MILHO) + 
                           (PROD_SOJA * preco_soja_ton * PESO_SOJA);
    const VUS = renda_bruta_ha / FATOR_ARREND;
    const valor_carbono = preco_carbono_brl * VOLUME_MADEIRA_HA * FATOR_CARBONO;
    const valor_agua = VUS * FATOR_AGUA;
    const CRS = valor_carbono + valor_agua;
    const ivcfValue = VM + VUS + CRS;

    return isFinite(ivcfValue) ? ivcfValue : 0;
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
        // Here we use the raw prices from the API, conversion happens inside calculateIndex
        acc[item.name] = item.price; 
        return acc;
    }, {} as { [key: string]: number });
    
    // Get the unconverted original price to show the user
    const originalAssetPrice = originalPrices[asset] || 0;

    // 2. Calculate the original index value
    const originalIndexValue = calculateIndex(originalPrices);

    // 3. Create the new set of prices based on the scenario
    const simulatedPrices = { ...originalPrices };
    if (changeType === 'percentage') {
        simulatedPrices[asset] = originalAssetPrice * (1 + value / 100);
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
