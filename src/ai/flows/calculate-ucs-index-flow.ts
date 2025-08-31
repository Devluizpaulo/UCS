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
        'Agua Futuros', 
    ];
    
    const pricesData = await getCommodityPrices({ commodities: commodityNames });
    
    if (!pricesData || pricesData.length === 0) {
      console.error('[LOG] No commodity prices received for UCS calculation. Returning default index value.');
      return { indexValue: 0 };
    }

    const prices: { [key: string]: number } = pricesData.reduce((acc, item) => {
        // Convert USD and EUR assets to BRL
        let priceInBrl = item.price;
        if (item.name === 'Soja Futuros' || item.name === 'Madeira Futuros') { // USD assets
            const usdRate = pricesData.find(p => p.name === 'USD/BRL Histórico')?.price || 1;
            priceInBrl = item.price * usdRate;
        } else if (item.name === 'Carbono Futuros') { // EUR asset
            const eurRate = pricesData.find(p => p.name === 'EUR/BRL Histórico')?.price || 1;
            priceInBrl = item.price * eurRate;
        }
        acc[item.name] = priceInBrl;
        return acc;
    }, {} as { [key: string]: number });

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

    // Check for NaN or Infinity
    if (!isFinite(ucsValue)) {
        console.error('[LOG] UCS calculation resulted in a non-finite number. PDM:', PDM, 'IVP:', IVP, 'Prices:', prices);
        return { indexValue: 0 };
    }

    return { indexValue: parseFloat(ucsValue.toFixed(4)) };
  }
);

