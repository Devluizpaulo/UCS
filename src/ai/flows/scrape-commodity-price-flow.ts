
'use server';
/**
 * @fileOverview A flow for scraping a value from a website.
 *
 * - scrapeUrl - A function that scrapes a value from a given URL and selector.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const ScrapeUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to scrape.'),
  selector: z.string().describe('The CSS selector to find the element.'),
});

const ScrapeUrlOutputSchema = z.string().nullable().describe('The scraped text content, or null if not found.');

export async function scrapeUrl(input: z.infer<typeof ScrapeUrlInputSchema>): Promise<z.infer<typeof ScrapeUrlOutputSchema>> {
    const scrapeUrlFlow = ai.defineFlow(
      {
        name: 'scrapeUrlFlow',
        inputSchema: ScrapeUrlInputSchema,
        outputSchema: ScrapeUrlOutputSchema,
      },
      async ({ url, selector }) => {
        try {
            // IMPORTANT: Web scraping is fragile and can break if the website's structure changes.
            // It's also subject to the website's terms of service.
            // For production apps, prefer official APIs when available.
            
            const response = await fetch(url, {
                // Use a common user-agent to avoid being blocked
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch ${url}: Status ${response.status}`);
                return null;
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            const value = $(selector).first().text().trim();
            
            if (!value) {
                console.warn(`Scraping for selector "${selector}" on ${url} returned no value.`);
                return null;
            }

            // Clean up the value (remove currency symbols, group separators, and convert comma to dot for decimal)
            const numericValue = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
            
            return numericValue || null;

        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          return null;
        }
      }
    );
    return await scrapeUrlFlow(input);
}
