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
    'Créditos de Carbono': { price: 27.50, change: 1.5, currency: 'EUR', url: 'https://br.investing.com/commodities/carbon-emissions', selector: '[data-test="instrument-price-last"]' },
    'Boi Gordo': { price: 225.40, change: -0.25, currency: 'BRL', url: 'https://br.investing.com/commodities/live-cattle-historical-data?cid=964528', selector: '[data-test="instrument-price-last"]' },
    'Milho': { price: 58.70, change: 0.5, currency: 'BRL', url: 'https://br.investing.com/commodities/us-corn?cid=964522', selector: '[data-test="instrument-price-last"]' },
    'Soja': { price: 125.20, change: -1.1, currency: 'BRL', url: 'https://br.investing.com/commodities/us-soybeans?cid=964523', selector: '[data-test="instrument-price-last"]' },
    'Madeira': { price: 550.00, change: 2.3, currency: 'USD', url: 'https://br.investing.com/commodities/lumber-historical-data', selector: '[data-test="instrument-price-last"]' },
    'Água': { price: 15.00, change: 0.0, currency: 'BRL' } // Price based on economic value (WWF report), hence stable change.
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
    const pricePromises = input.commodities.map(async (name) => {
        let data = commodityData[name] || { price: 0, change: 0, currency: 'BRL' };
        let price = data.price;

        if (data.url && data.selector) {
            try {
                // NOTE: This is a placeholder for actual web scraping.
                // The scrapeUrlFlow currently returns a mock value.
                // In a real scenario, it would fetch and parse the live price.
                const scrapedPrice = await scrapeUrlFlow({ url: data.url, selector: data.selector });
                if (scrapedPrice) {
                    price = parseFloat(scrapedPrice);
                }
            } catch (error) {
                console.error(`Failed to scrape ${name}:`, error);
                // Fallback to mock price if scraping fails
            }
        }

        if (data.currency === 'EUR') {
            price = price * exchangeRates.EUR_BRL;
        } else if (data.currency === 'USD') {
            price = price * exchangeRates.USD_BRL;
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
