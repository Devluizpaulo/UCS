'use server';
/**
 * @fileOverview A flow for analyzing a financial asset using AI.
 *
 * - analyzeAsset - A function that returns an AI-generated analysis of an asset.
 * - AnalyzeAssetInput - The input type for the analyzeAsset function.
 * - AnalyzeAssetOutput - The return type for the analyzeAsset function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

const AnalyzeAssetInputSchema = z.object({
  assetName: z.string().describe('The name of the financial asset.'),
  historicalData: z.array(z.number()).describe('An array of the last 30 days of historical closing prices.'),
});
export type AnalyzeAssetInput = z.infer<typeof AnalyzeAssetInputSchema>;

const AnalyzeAssetOutputSchema = z.object({
  analysis: z.string().describe('A concise, expert analysis of the asset based on its historical data and recent news. Should cover volatility, recent trends, and overall market sentiment, referencing specific news that support the conclusion.'),
  sources: z.array(z.object({
    title: z.string().describe('The headline of the news article.'),
    url: z.string().url().describe('The URL to the news article.'),
    source: z.string().describe('The source of the news (e.g., news outlet name).'),
  })).describe('A list of news articles used as sources for the analysis.'),
});
export type AnalyzeAssetOutput = z.infer<typeof AnalyzeAssetOutputSchema>;


const getNewsForAssetTool = ai.defineTool(
  {
    name: 'getNewsForAsset',
    description: 'Get the latest news headlines for a given financial asset.',
    inputSchema: z.object({ asset: z.string() }),
    outputSchema: z.object({
      headlines: z.array(
        z.object({
          title: z.string(),
          source: z.string(),
          url: z.string().url(),
          publishedAt: z.string().datetime(),
        })
      ),
    }),
  },
  async ({ asset }) => {
    try {
      console.log(`[LOG] Searching news for: ${asset}`);
      const searchQuery = encodeURIComponent(`${asset} preço`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=nws`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const headlines: any[] = [];
      
      $('a[href^="/url?q="]').each((_i, el) => {
        if (headlines.length >= 5) return; 

        const link = $(el);
        const url = link.attr('href')?.split('/url?q=')[1].split('&')[0];
        const title = link.find('div[role="heading"]').text().trim();
        const source = link.find('span').first().text().trim();
        
        if(url && title && source){
             headlines.push({
                title,
                url: decodeURIComponent(url),
                source,
                publishedAt: new Date().toISOString(), 
            });
        }
      });
      
      return { headlines };
    } catch (error) {
      console.error("[LOG] Failed to scrape news:", error);
      return { headlines: [] };
    }
  }
);


const analysisPrompt = ai.definePrompt({
  name: 'assetAnalysisPrompt',
  input: { schema: AnalyzeAssetInputSchema },
  output: { schema: AnalyzeAssetOutputSchema },
  tools: [getNewsForAssetTool],
  prompt: `Você é um analista financeiro sênior especializado em commodities e ativos ambientais. Sua tarefa é fornecer uma análise curta e direta para um público executivo.

Primeiro, use a ferramenta 'getNewsForAsset' para buscar notícias recentes sobre o ativo '{{{assetName}}}'.

Depois, analise o ativo '{{{assetName}}}' com base nos dados históricos de preços dos últimos 30 dias e nas notícias que você encontrou.

Dados de Preço: {{{json historicalData}}}

Sua análise de texto, no campo 'analysis', deve conter no máximo 4 frases e abordar:
1.  **Volatilidade:** O quão estável ou volátil o preço tem sido.
2.  **Tendência:** Se há uma tendência clara de alta, baixa ou lateralização, considerando os dados e as notícias.
3.  **Sentimento:** Uma conclusão geral sobre o sentimento do mercado para este ativo (otimista, pessimista, neutro), citando pelo menos uma notícia que embase sua conclusão.

No campo 'sources', liste as notícias que você utilizou para a sua análise. Inclua o título, a URL e a fonte de cada notícia.

Não use jargões. Seja claro, objetivo e profissional.
`,
});

const analyzeAssetFlow = ai.defineFlow(
    {
      name: 'analyzeAssetFlow',
      inputSchema: AnalyzeAssetInputSchema,
      outputSchema: AnalyzeAssetOutputSchema,
    },
    async (input) => {
      try {
        const { output } = await analysisPrompt(input);
        return output!;
      } catch (error) {
        console.error('[LOG] Genkit analysisPrompt failed:', error);
        return {
          analysis: "A análise da IA não pôde ser gerada no momento devido a um erro no serviço. Por favor, tente novamente mais tarde.",
          sources: [],
        };
      }
    }
  );

export async function analyzeAsset(input: AnalyzeAssetInput): Promise<AnalyzeAssetOutput> {
  return await analyzeAssetFlow(input);
}
