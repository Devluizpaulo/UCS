'use server';
/**
 * @fileOverview A flow for analyzing financial risk metrics using AI.
 *
 * - analyzeRisk - A function that returns an AI-generated analysis of risk data.
 * - AnalyzeRiskInput - The input type for the analyzeRisk function.
 * - AnalyzeRiskOutput - The return type for the analyzeRisk function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RiskDataItemSchema = z.object({
    asset: z.string(),
    volatility: z.number(),
    correlation: z.number(),
});

const AnalyzeRiskInputSchema = z.object({
  riskData: z.array(RiskDataItemSchema).describe('An array of assets with their calculated volatility and correlation to the main index.'),
});
export type AnalyzeRiskInput = z.infer<typeof AnalyzeRiskInputSchema>;


const AnalyzeRiskOutputSchema = z.object({
  summary: z.string().describe('A concise, expert analysis of the overall risk landscape based on the provided data. Should be 2-3 sentences long and highlight the most volatile assets and any significant correlations.'),
});
export type AnalyzeRiskOutput = z.infer<typeof AnalyzeRiskOutputSchema>;


const analysisPrompt = ai.definePrompt({
  name: 'riskAnalysisPrompt',
  input: { schema: AnalyzeRiskInputSchema },
  output: { schema: AnalyzeRiskOutputSchema },
  prompt: `Você é um analista de risco quantitativo. Sua tarefa é analisar os dados de risco fornecidos para um portfólio de ativos que compõem um índice.

Dados de Risco:
{{{json riskData}}}

Com base nesses dados, gere um resumo analítico (o campo 'summary') com no máximo 3 frases. Sua análise deve:
1.  Identificar os 1-2 ativos mais voláteis e mencionar seu impacto potencial no índice.
2.  Apontar as correlações mais fortes (positivas ou negativas) e explicar o que isso significa para a diversificação do índice.
3.  Concluir com uma visão geral do perfil de risco atual do índice (ex: "concentrado em commodities agrícolas", "influenciado pelo câmbio", etc.).

Seja objetivo e use uma linguagem clara e profissional. Não repita os números exatos, mas interprete o que eles significam.
`,
});

const analyzeRiskFlow = ai.defineFlow(
    {
      name: 'analyzeRiskFlow',
      inputSchema: AnalyzeRiskInputSchema,
      outputSchema: AnalyzeRiskOutputSchema,
    },
    async (input) => {
      try {
        const { output } = await analysisPrompt(input);
        return output!;
      } catch (error) {
        console.error('[LOG] Genkit analyzeRiskPrompt failed:', error);
        return {
          summary: "A análise de risco da IA não pôde ser gerada no momento. Verifique se os dados de entrada estão corretos e tente novamente.",
        };
      }
    }
  );

export async function analyzeRisk(input: AnalyzeRiskInput): Promise<AnalyzeRiskOutput> {
  return await analyzeRiskFlow(input);
}
