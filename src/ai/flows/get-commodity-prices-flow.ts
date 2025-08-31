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
import type { CommodityPriceData } from '@/lib/types';
import { scrapeUrlFlow } from './scrape-commodity-price-flow';


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
const commodityData: { [key: string]: { price: number; change: number; url?: string; selector?: string; currency?: 'USD' | 'EUR' | 'BRL'} } = {
    'Soja Futuros': { price: 125.20, change: -1.1, currency: 'BRL', url: 'https://br.investing.com/commodities/us-soybeans-historical-data?cid=964523', selector: '[data-test="instrument-price-last"]' },
    'USD/BRL Histórico': { price: 5.45, change: 0.1, currency: 'BRL', url: 'https://br.investing.com/currencies/usd-brl-historical-data', selector: '[data-test="instrument-price-last"]' },
    'EUR/BRL Histórico': { price: 5.85, change: -0.2, currency: 'BRL', url: 'https://br.investing.com/currencies/eur-brl-historical-data', selector: '[data-test="instrument-price-last"]' },
};


const getCommodityPricesFlow = ai.defineFlow(
  {
    name: 'getCommodityPricesFlow',
    inputSchema: CommodityPricesInputSchema,
    outputSchema: CommodityPricesOutputSchema,
  },
  async (input) => {
    const pricePromises = input.commodities.map(async (name) => {
        let data = commodityData[name] || { price: 0, change: 0, currency: 'BRL' };
        let price = data.price;

        if (data.url && data.selector) {
            try {
                const scrapedPrice = await scrapeUrlFlow({ url: data.url, selector: data.selector });
                if (scrapedPrice) {
                    price = parseFloat(scrapedPrice);
                } else {
                     console.log(`[LOG] Could not scrape price for ${name}. Using mock value.`);
                }
            } catch (error) {
                console.error(`[LOG] Error scraping ${name}:`, error);
                // Fallback to mock price if scraping fails
            }
        }

        return {
            name,
            price: parseFloat(price.toFixed(2)),
            change: data.change,
        };
    });

    const prices = await Promise.all(pricePromises);
    return { prices };
  }
);
