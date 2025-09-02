

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
import type { ScenarioResult, SimulateScenarioInput, FormulaParameters, CalculateUcsIndexOutput } from '@/lib/types';
import { getFormulaParameters } from '@/lib/formula-service';


/**
 * Pure calculation function for the UCS Index. This is not a flow and can be called from anywhere.
 * @param prices - A dictionary of asset names to their latest prices.
 * @param params - The formula parameters.
 * @returns {CalculateUcsIndexOutput} The calculated index data.
 */
function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): CalculateUcsIndexOutput {
      const defaultResult = { 
          indexValue: 0, 
          isConfigured: params.isConfigured,
          components: { vm: 0, vus: 0, crs: 0 }, 
          vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
      };
      
      if (!params.isConfigured) {
          return defaultResult;
      }
  
      // --- Data Validation ---
      const requiredAssets = [
          'USD/BRL Histórico', 'EUR/BRL Histórico', 'Madeira Futuros',
          'Boi Gordo Futuros - Ago 25 (BGIc1)', 'Milho Futuros', 'Soja Futuros', 'Carbono Futuros'
      ];
      for (const asset of requiredAssets) {
          if (prices[asset] === undefined || prices[asset] === null || prices[asset] === 0) {
              console.error(`[LOG] Missing or zero price for required asset in calculation: ${asset}.`);
              return { ...defaultResult, isConfigured: true }; // Return default but indicate it was configured
          }
      }
  
      // Exchange Rates
      const taxa_usd_brl = prices['USD/BRL Histórico'];
      const taxa_eur_brl = prices['EUR/BRL Histórico'];
  
      // Prices (raw)
      const preco_lumber_mbf = prices['Madeira Futuros'];
      const preco_boi_arroba = prices['Boi Gordo Futuros - Ago 25 (BGIc1)'];
      const preco_milho_bushel_cents = prices['Milho Futuros'];
      const preco_soja_bushel_cents = prices['Soja Futuros'];
      const preco_carbono_eur = prices['Carbono Futuros'];
  
      // --- Price Conversions ---
      const preco_madeira_serrada_m3_usd = (preco_lumber_mbf / 1000) * 424;
      const preco_madeira_serrada_m3_brl = preco_madeira_serrada_m3_usd * taxa_usd_brl;
      const preco_madeira_tora_m3_brl = preco_madeira_serrada_m3_brl * params.FATOR_CONVERSAO_SERRADA_TORA;
      const preco_milho_ton_usd = (preco_milho_bushel_cents / 100) * (1000 / 25.4);
      const preco_milho_ton_brl = preco_milho_ton_usd * taxa_usd_brl;
      const preco_soja_ton_usd = (preco_soja_bushel_cents / 100) * (1000 / 27.2);
      const preco_soja_ton_brl = preco_soja_ton_usd * taxa_usd_brl;
      const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
      
      // --- Formula Calculation ---
      const VM = preco_madeira_tora_m3_brl * params.VOLUME_MADEIRA_HA;
      const renda_pecuaria = params.PROD_BOI * preco_boi_arroba * params.PESO_PEC;
      const renda_milho = params.PROD_MILHO * preco_milho_ton_brl * params.PESO_MILHO;
      const renda_soja = params.PROD_SOJA * preco_soja_ton_brl * params.PESO_SOJA;
      const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
      const VUS = renda_bruta_ha / params.FATOR_ARREND;
      const valor_carbono = preco_carbono_brl * params.VOLUME_MADEIRA_HA * params.FATOR_CARBONO;
      const valor_agua = VUS * params.FATOR_AGUA;
      const CRS = valor_carbono + valor_agua;
      
      const ucsValue = VM + VUS + CRS;
  
      if (!isFinite(ucsValue)) {
          console.error('[LOG] UCS calculation resulted in a non-finite number. Returning default.');
          return { ...defaultResult, isConfigured: true };
      }
  
      return { 
          indexValue: parseFloat(ucsValue.toFixed(2)),
          isConfigured: params.isConfigured,
          components: {
              vm: parseFloat(VM.toFixed(2)),
              vus: parseFloat(VUS.toFixed(2)),
              crs: parseFloat(CRS.toFixed(2)),
          },
          vusDetails: {
              pecuaria: parseFloat((renda_pecuaria / params.FATOR_ARREND).toFixed(2)),
              milho: parseFloat((renda_milho / params.FATOR_ARREND).toFixed(2)),
              soja: parseFloat((renda_soja / params.FATOR_ARREND).toFixed(2)),
          }
      };
}


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

        const originalPrices: { [key: string]: number } = pricesData.reduce((acc, item) => {
            acc[item.name] = item.price; 
            return acc;
        }, {} as { [key: string]: number });
        
        // Get the unconverted original price to show the user
        const originalAssetPrice = originalPrices[asset] || 0;

        // 2. Calculate the original index value using the pure function
        const originalIndexResult = calculateIndex(originalPrices, params);
        const originalIndexValue = originalIndexResult.indexValue;

        // 3. Create the new set of prices based on the scenario
        const simulatedPrices = { ...originalPrices };
        if (changeType === 'percentage') {
            simulatedPrices[asset] = originalAssetPrice * (1 + value / 100);
        } else { // absolute
            simulatedPrices[asset] = value;
        }

        // 4. Calculate the new index value using the pure function
        const newIndexResult = calculateIndex(simulatedPrices, params);
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
