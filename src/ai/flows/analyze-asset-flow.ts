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

const AnalyzeAssetInputSchema = z.object({
  assetName: z.string().describe('The name of the financial asset.'),
  historicalData: z.array(z.number()).describe('An array of the last 30 days of historical closing prices.'),
});
export type AnalyzeAssetInput = z.infer<typeof AnalyzeAssetInputSchema>;

const AnalyzeAssetOutputSchema = z.object({
  analysis: z.string().describe('A concise, expert analysis of the asset based on its historical data and recent news. Should cover volatility, recent trends, and overall market sentiment, referencing specific news that support the conclusion.'),
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
    console.log(`[LOG] Searching news for: ${asset}`);
    // In a real application, this would call a News API (e.g., Google News, NewsAPI.org).
    // For this example, we'll return mock data.
    const mockNews: { [key: string]: any[] } = {
        'Soja Futuros': [
            { title: "Seca no Meio-Oeste dos EUA pode impactar safra de soja", source: "AgroNews", url: "https://example.com/news1", publishedAt: new Date().toISOString() },
            { title: "China aumenta importação de soja brasileira em 20%", source: "Trade Global", url: "https://example.com/news2", publishedAt: new Date(Date.now() - 86400000).toISOString() },
        ],
        'USD/BRL Histórico': [
            { title: "Banco Central sinaliza manutenção da taxa de juros, fortalecendo o Real", source: "Economia BR", url: "https://example.com/news3", publishedAt: new Date().toISOString() },
            { title: "Dados de inflação nos EUA abaixo do esperado pressionam o Dólar", source: "Global Markets", url: "https://example.com/news4", publishedAt: new Date(Date.now() - 172800000).toISOString() },
        ],
        'EUR/BRL Histórico': [
            { title: "Crise energética na Europa gera preocupações e desvaloriza o Euro", source: "EuroInvest", url: "https://example.com/news5", publishedAt: new Date().toISOString() },
        ],
        'Boi Gordo Futuros': [
            { title: "Exportações de carne bovina atingem recorde no trimestre", source: "Pecuária Forte", url: "https://example.com/news6", publishedAt: new Date().toISOString() },
        ],
        'Milho Futuros': [
            { title: "Previsão de safra recorde de milho pressiona preços para baixo", source: "AgroPortal", url: "https://example.com/news7", publishedAt: new Date().toISOString() },
        ],
        'Madeira Futuros': [
            { title: "Mercado imobiliário aquecido nos EUA impulsiona demanda por madeira", source: "Construction Today", url: "https://example.com/news8", publishedAt: new Date().toISOString() },
        ],
        'Carbono Futuros': [
            { title: "Novas regulamentações europeias para emissões podem aumentar o preço do crédito de carbono", source: "Climate Finance", url: "https://example.com/news9", publishedAt: new Date().toISOString() },
        ],
    };
    return { headlines: mockNews[asset] || [] };
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

Sua análise deve conter no máximo 4 frases e abordar:
1.  **Volatilidade:** O quão estável ou volátil o preço tem sido.
2.  **Tendência:** Se há uma tendência clara de alta, baixa ou lateralização, considerando os dados e as notícias.
3.  **Sentimento:** Uma conclusão geral sobre o sentimento do mercado para este ativo (otimista, pessimista, neutro), citando pelo menos uma notícia que embase sua conclusão.

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
      const { output } = await analysisPrompt(input);
      return output!;
    }
  );

export async function analyzeAsset(input: AnalyzeAssetInput): Promise<AnalyzeAssetOutput> {
  return await analyzeAssetFlow(input);
}
