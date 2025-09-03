
'use server';
/**
 * @fileOverview A flow for getting a commodity quote using Google Search.
 *
 * - getCommodityQuoteFlow - The main flow function.
 * - GetCommodityQuoteInput - The input type for the flow.
 * - GetCommodityQuoteOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleSearch } from '../tools/google-search-tool';

const GetCommodityQuoteInputSchema = z.object({
  commodity_query: z.string().describe('The search query to find the commodity price, e.g., "current price of soybean futures in USD"'),
});

const GetCommodityQuoteOutputSchema = z.object({
  price: z.number().describe('The numerical price of the commodity found.'),
});

export async function getCommodityQuoteFlow(
  input: z.infer<typeof GetCommodityQuoteInputSchema>
): Promise<z.infer<typeof GetCommodityQuoteOutputSchema>> {
  const getQuoteFlow = ai.defineFlow(
    {
      name: 'getCommodityQuoteFlow',
      inputSchema: GetCommodityQuoteInputSchema,
      outputSchema: GetCommodityQuoteOutputSchema,
      tools: [googleSearch],
    },
    async (input) => {
      const llmResponse = await ai.generate({
        prompt: `What is the price of the following commodity: ${input.commodity_query}? Please return only the numerical value of the price. Use the available tools to find the information if necessary.`,
        model: 'googleai/gemini-2.5-flash',
        tools: [googleSearch],
        output: {
          schema: GetCommodityQuoteOutputSchema,
        },
      });

      const output = llmResponse.output();
      if (!output) {
        throw new Error('Could not determine the price from Google Search.');
      }
      return output;
    }
  );

  return await getQuoteFlow(input);
}
