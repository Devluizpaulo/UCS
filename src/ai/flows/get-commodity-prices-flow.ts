'use server';
/**
 * @fileOverview A flow for fetching commodity prices.
 *
 * - getCommodityPrices - A function that returns simulated commodity prices.
 * - CommodityPricesInput - The input type for the getCommodityPrices function.
 * - CommodityPricesOutput - The return type for the getCommodityPrices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Commodity, CommodityPriceData } from '@/lib/types';


const CommodityPricesInputSchema = z.object({
    commodities: z.array(z.string()).describe("A list of commodity names to fetch prices for.")
});
export type CommodityPricesInput = z.infer<typeof CommodityPricesInputSchema>;

const CommodityPricesOutputSchema = z.object({
    prices: z.array(z.object({
        name: z.string(),
        price: z.number(),
        change: z.number(),
    })).describe("A list of commodities with their prices and 24h change.")
});
export type CommodityPricesOutput = z.infer<typeof CommodityPricesOutputSchema>;


export async function getCommodityPrices(input: CommodityPricesInput): Promise<CommodityPriceData[]> {
    const flowResult = await getCommodityPricesFlow(input);
    return flowResult.prices;
}


// Mock data simulating fetching from an API based on previous day's closing.
const commodityData: { [key: string]: { price: number; change: number } } = {
    'Créditos de Carbono': { price: 27.50, change: 1.5 }, // Assuming in EUR, will be converted
    'Boi Gordo': { price: 225.40, change: -0.25 }, // BRL
    'Milho': { price: 58.70, change: 0.5 }, // BRL
    'Soja': { price: 125.20, change: -1.1 }, // BRL
    'Madeira': { price: 550.00, change: 2.3 }, // Assuming in USD, will be converted
    'Água': { price: 15.00, change: 0.1 } // BRL
};

const exchangeRates = {
    USD_BRL: 5.45,
    EUR_BRL: 5.85,
};


const getCommodityPricesFlow = ai.defineFlow(
  {
    name: 'getCommodityPricesFlow',
    inputSchema: CommodityPricesInputSchema,
    outputSchema: CommodityPricesOutputSchema,
  },
  async (input) => {
    const prices = input.commodities.map(name => {
        let data = commodityData[name] || { price: 0, change: 0 };
        let price = data.price;

        // Simulate currency conversion for specific commodities
        if (name === 'Créditos de Carbono') {
            price = data.price * exchangeRates.EUR_BRL;
        } else if (name === 'Madeira') {
            price = data.price * exchangeRates.USD_BRL;
        }

        return {
            name,
            price: parseFloat(price.toFixed(2)),
            change: data.change,
        };
    });

    return { prices };
  }
);
