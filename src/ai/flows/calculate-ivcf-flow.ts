'use server';
/**
 * @fileOverview A flow for calculating the UCS Index based on a detailed pricing methodology.
 *
 * - calculateUcsIndex - Calculates the final UCS index value based on the provided formula.
 * - CalculateUcsIndexOutput - The return type for the calculateUcsIndex function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCommodityPrices } from './get-commodity-prices-flow';

const CalculateUcsIndexOutputSchema = z.object({
  indexValue: z.number().describe('The calculated value of the UCS Index.'),
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

export async function calculateUcsIndex(): Promise<CalculateUcsIndexOutput> {
  return await calculateUcsIndexFlow();
}

const calculateUcsIndexFlow = ai.defineFlow(
  {
    name: 'calculateUcsIndexFlow',
    outputSchema: CalculateUcsIndexOutputSchema,
  },
  async () => {
    const commodityNames = [
        'USD/BRL Histórico',
        'EUR/BRL Histórico',
        'Boi Gordo Futuros',
        'Soja Futuros',
        'Milho Futuros',
        'Madeira Futuros',
        'Carbono Futuros',
    ];
    
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    const defaultResult = { indexValue: 0, components: { vm: 0, vus: 0, crs: 0 }, vusDetails: { pecuaria: 0, milho: 0, soja: 0 }};

    if (!pricesData || pricesData.length === 0) {
      console.error('[LOG] No commodity prices received for UCS calculation. Returning default index value.');
      return defaultResult;
    }

    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        acc[item.name] = item.price;
        return acc;
    }, {} as { [key: string]: number });
    
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
    const FATOR_CONVERSAO_SERRADA_TORA = 0.3756; // Fator de conversão de madeira serrada para tora (em pé)

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
    // 1 board foot = 0.00235974 m³ -> 1 m³ = 423.776 board feet. Using 424 as per examples.
    const preco_madeira_serrada_m3 = (preco_lumber_mbf / 1000) * 424 * taxa_usd_brl;
    const preco_madeira_tora_m3 = preco_madeira_serrada_m3 * FATOR_CONVERSAO_SERRADA_TORA;

    // 1 bushel of corn = 25.4 kg. 1 ton = 1000 kg.
    const preco_milho_ton = (preco_milho_bushel_cents / 100) * (1000 / 25.4) * taxa_usd_brl;
    // 1 bushel of soy = 27.2 kg. 1 ton = 1000 kg.
    const preco_soja_ton = (preco_soja_bushel_cents / 100) * (1000 / 27.2) * taxa_usd_brl;
    const preco_carbono_brl = preco_carbono_eur * taxa_eur_brl;
    
    // --- Formula Calculation ---
    const VM = preco_madeira_tora_m3 * VOLUME_MADEIRA_HA;

    const renda_pecuaria = PROD_BOI * preco_boi_arroba * PESO_PEC;
    const renda_milho = PROD_MILHO * preco_milho_ton * PESO_MILHO;
    const renda_soja = PROD_SOJA * preco_soja_ton * PESO_SOJA;
    const renda_bruta_ha = renda_pecuaria + renda_milho + renda_soja;
    const VUS = renda_bruta_ha / FATOR_ARREND;
    
    const valor_carbono = preco_carbono_brl * VOLUME_MADEIRA_HA * FATOR_CARBONO;
    const valor_agua = VUS * FATOR_AGUA;
    const CRS = valor_carbono + valor_agua;
    
    const ucsValue = VM + VUS + CRS;

    if (!isFinite(ucsValue)) {
        console.error('[LOG] UCS calculation resulted in a non-finite number. VM:', VM, 'VUS:', VUS, 'CRS:', CRS, 'Prices:', prices);
        return defaultResult;
    }

    return { 
        indexValue: parseFloat(ucsValue.toFixed(2)),
        components: {
            vm: parseFloat(VM.toFixed(2)),
            vus: parseFloat(VUS.toFixed(2)),
            crs: parseFloat(CRS.toFixed(2)),
        },
        vusDetails: {
            pecuaria: parseFloat((renda_pecuaria / FATOR_ARREND).toFixed(2)),
            milho: parseFloat((renda_milho / FATOR_ARREND).toFixed(2)),
            soja: parseFloat((renda_soja / FATOR_ARREND).toFixed(2)),
        }
    };
  }
);
