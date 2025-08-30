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
  analysis: z.string().describe('A concise, expert analysis of the asset based on its historical data. Should cover volatility, recent trends, and overall market sentiment.'),
});
export type AnalyzeAssetOutput = z.infer<typeof AnalyzeAssetOutputSchema>;


const analysisPrompt = ai.definePrompt({
  name: 'assetAnalysisPrompt',
  input: { schema: AnalyzeAssetInputSchema },
  output: { schema: AnalyzeAssetOutputSchema },
  prompt: `Você é um analista financeiro sênior especializado em commodities e ativos ambientais. Sua tarefa é fornecer uma análise curta e direta para um público executivo.

Analise o ativo '{{{assetName}}}' com base nos dados históricos de preços dos últimos 30 dias.

Dados de Preço: {{{json historicalData}}}

Sua análise deve conter no máximo 3 frases e abordar:
1.  **Volatilidade:** O quão estável ou volátil o preço tem sido.
2.  **Tendência:** Se há uma tendência clara de alta, baixa ou lateralização.
3.  **Sentimento:** Uma conclusão geral sobre o sentimento do mercado para este ativo (otimista, pessimista, neutro).

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
