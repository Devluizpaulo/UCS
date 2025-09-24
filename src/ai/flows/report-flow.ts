
'use server';
/**
 * @fileOverview Fluxo de IA para geração de relatórios de análise de ativos.
 *
 * - generateReport - A função principal que orquestra a geração do relatório.
 * - ReportInputSchema - O Zod schema para a entrada do fluxo.
 * - ReportOutputSchema - O Zod schema para a saída do fluxo.
 */

import { genkit, z } from '@/ai/genkit';
import { generateReportFlow } from './report-flow';


// Esquema de entrada para o fluxo de geração de relatório
export const ReportInputSchema = z.object({
  assetId: z.string().describe('O ID do ativo a ser analisado.'),
  dateRange: z.object({
    from: z.string().describe('A data de início do período de análise (ISO 8601).'),
    to: z.string().describe('A data de fim do período de análise (ISO 8601).'),
  }),
  userPrompt: z.string().optional().describe('Observações ou perguntas adicionais do usuário para guiar a análise.'),
  // No futuro, podemos adicionar os dados históricos aqui
  // historicalData: z.any().describe('Os dados históricos do ativo para o período selecionado.'),
});

export type ReportInput = z.infer<typeof ReportInputSchema>;


// Esquema de saída para o fluxo de geração de relatório
export const ReportOutputSchema = z.object({
  executiveSummary: z.string().describe('Um resumo executivo conciso sobre a performance do ativo no período.'),
  trendAnalysis: z.string().describe('Uma análise detalhada das tendências observadas, incluindo altas, baixas e padrões.'),
  volatilityAnalysis: z.string().describe('Uma avaliação da volatilidade do ativo durante o período.'),
  conclusion: z.string().describe('Uma conclusão geral e possíveis insights futuros.'),
});

export type ReportOutput = z.infer<typeof ReportOutputSchema>;


const reportGeneratorPrompt = genkit.definePrompt(
    {
      name: 'reportGeneratorPrompt',
      input: { schema: ReportInputSchema },
      output: { schema: ReportOutputSchema },
      prompt: `
        Você é um analista financeiro sênior, especializado em ativos ambientais e no mercado de sustentabilidade brasileiro. Sua tarefa é criar uma análise executiva clara, concisa e perspicaz sobre a performance de um ativo financeiro em um determinado período.

        **Ativo para Análise:** {{assetId}}
        **Período de Análise:** de {{dateRange.from}} até {{dateRange.to}}

        **Observações do Usuário (se houver, considere-as com prioridade):**
        {{userPrompt}}

        **Dados Históricos:**
        (Os dados históricos serão fornecidos aqui em uma etapa futura. Por enquanto, baseie-se no perfil do ativo e nas observações do usuário para gerar uma resposta de exemplo.)

        **Sua Tarefa:**
        Com base NOS DADOS FORNECIDOS e no seu conhecimento, gere uma análise estruturada contendo os seguintes campos. NÃO ESPECULE OU "ALUCINE" informações que não possam ser comprovadas pelos dados.
        1.  **executiveSummary:** Um parágrafo curto no início resumindo os pontos mais importantes.
        2.  **trendAnalysis:** Descreva a tendência principal (alta, baixa, lateralidade), identifique picos e vales significativos e explique possíveis causas baseadas nos dados.
        3.  **volatilityAnalysis:** Comente sobre a volatilidade do ativo no período. Foi um período estável ou instável?
        4.  **conclusion:** Feche com uma conclusão sobre o desempenho do ativo e o que pode ser esperado para o futuro, se possível.

        Seja objetivo e use uma linguagem profissional, como faria em um relatório para um comitê de investimentos.
      `,
    }
  );


/**
 * Orquestra a geração do relatório de análise de ativos.
 * @param input Os dados de entrada para a geração do relatório.
 * @returns Uma promessa que resolve para a análise gerada pela IA.
 */
export const generateReportFlow = genkit.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (input) => {
    
    // Etapa 1: Chamar o prompt de IA com os dados de entrada
    const llmResponse = await reportGeneratorPrompt.generate({
        input: input,
    });
    
    const output = llmResponse.output();

    // Etapa 2: Retornar a saída estruturada ou um objeto vazio em caso de falha
    if (!output) {
      console.error("[report-flow] A resposta da IA não gerou uma saída estruturada válida.");
      return {
          executiveSummary: 'Erro: Não foi possível gerar a análise.',
          trendAnalysis: '',
          volatilityAnalysis: '',
          conclusion: '',
      };
    }
    
    return output;
  }
);


/**
 * Função de invólucro para ser chamada a partir do front-end.
 * @param input Os dados de entrada para a geração do relatório.
 * @returns O resultado da análise da IA.
 */
export async function generateReport(input: ReportInput): Promise<ReportOutput> {
    console.log('[report-flow] Iniciando geração de relatório com input:', input);
    try {
        const result = await generateReportFlow(input);
        console.log('[report-flow] Relatório gerado com sucesso.');
        return result;
    } catch (error) {
        console.error('[report-flow] Ocorreu um erro durante a geração do relatório:', error);
        return {
             executiveSummary: 'Erro: Ocorreu uma falha inesperada ao tentar gerar a análise. Por favor, tente novamente.',
             trendAnalysis: '',
             volatilityAnalysis: '',
             conclusion: '',
        }
    }
}
