
'use server';
/**
 * @fileOverview A flow for calculating the UCS Index based on a detailed pricing methodology.
 *
 * - calculateUcsIndex - Calculates the final UCS index value based on the provided formula.
 * - CalculateUcsIndexOutput - The return type for the calculateUcsIndex function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCommodityPrices } from '@/lib/data-service';
import { getFormulaParameters } from '@/lib/formula-service';
import type { FormulaParameters } from '@/lib/types';

const CalculateUcsIndexOutputSchema = z.object({
  indexValue: z.number().describe('The calculated value of the UCS Index.'),
  isConfigured: z.boolean().describe('Whether the formula has been configured by the user.'),
  components: z.object({
    vm: z.number().describe('Valor da Madeira (VM)'),
    vus: z.number().describe('Valor de Uso do Solo (VUS)'),
    crs: z.number().describe('Custo da Responsabilidade Socioambiental (CRS)'),
  }),
  vusDetails: z.object({
      pecuaria: z.number(),
      milho: z.number(),
      soja: z.number(),
  }),
});
export type CalculateUcsIndexOutput = z.infer<typeof CalculateUcsIndexOutputSchema>;

// Internal helper function for calculation. Can be reused by other flows.
export async function calculateIndex(prices: { [key: string]: number }, params: FormulaParameters): Promise<CalculateUcsIndexOutput> {
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


const calculateUcsIndexFlow = ai.defineFlow(
  {
    name: 'calculateUcsIndexFlow',
    outputSchema: CalculateUcsIndexOutputSchema,
  },
  async () => {
    // Fetch dynamic data and parameters in parallel
    const [pricesData, params] = await Promise.all([
        getCommodityPrices(),
        getFormulaParameters()
    ]);

    if (!params.isConfigured) {
        return { 
            indexValue: 0, 
            isConfigured: false,
            components: { vm: 0, vus: 0, crs: 0 }, 
            vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
        };
    }
    
    if (!pricesData || pricesData.length === 0) {
      console.error('[LOG] No commodity prices received for UCS calculation.');
      return { 
          indexValue: 0, 
          isConfigured: true,
          components: { vm: 0, vus: 0, crs: 0 }, 
          vusDetails: { pecuaria: 0, milho: 0, soja: 0 }
      };
    }

    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });
    
    return calculateIndex(prices, params);
  }
);


export async function calculateUcsIndex(): Promise<CalculateUcsIndexOutput> {
  return await calculateUcsIndexFlow();
}
