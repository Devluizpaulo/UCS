
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
import { getFormulaParameters, calculateIndex } from '@/lib/formula-service';

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


export async function calculateUcsIndex(): Promise<CalculateUcsIndexOutput> {
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
    
    // Use the pure calculation function from the service
    return calculateIndex(prices, params);
}
