
'use server';
/**
 * @fileOverview Fluxo de IA para geração de relatórios de análise de ativos.
 *
 * - generateReport - A função principal que orquestra a geração do relatório.
 * - ReportInputSchema - O Zod schema para a entrada do fluxo.
 * - ReportOutputSchema - O Zod schema para a saída do fluxo.
 */

import { z, ai } from '@/ai/genkit';
import { getCotacoesHistoricoPorRange } from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';


// Esquema de entrada para o fluxo de geração de relatório
export const ReportInputSchema = z.object({
  assetId: z.string().describe('O ID do ativo a ser analisado.'),
  dateRange: z.object({
    from: z.date().describe('A data de início do período de análise.'),
    to: z.date().describe('A data de fim do período de análise.'),
  }),
  userPrompt: z.string().optional().describe('Observações ou perguntas adicionais do usuário para guiar a análise.'),
  historicalData: z.any().optional().describe('Os dados históricos do ativo para o período selecionado.'),
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


const reportGeneratorPrompt = ai.definePrompt(
    {
      name: 'reportGeneratorPrompt',
      input: { schema: ReportInputSchema },
      output: { schema: ReportOutputSchema },
      prompt: `
        Você é um analista financeiro sênior, especializado em ativos ambientais e no mercado de sustentabilidade brasileiro. Sua tarefa é criar uma análise executiva clara, concisa e perspicaz sobre a performance de um ativo financeiro em um determinado período, baseando-se EXCLUSIVAMENTE nos dados fornecidos.

        **Ativo para Análise:** {{assetId}}
        **Período de Análise:** de {{dateRange.from}} até {{dateRange.to}}

        **Observações do Usuário (se houver, considere-as com prioridade na sua análise):**
        {{#if userPrompt}}
        <user_prompt>
        {{userPrompt}}
        </user_prompt>
        {{/if}}

        **Dados Históricos do Ativo (Fonte da Verdade):**
        O formato dos dados é um JSON array, onde cada objeto representa um registro de cotação com 'data' e 'valor' (ou 'ultimo').
        \`\`\`json
        {{{historicalData}}}
        \`\`\`

        **Sua Tarefa:**
        Com base NOS DADOS FORNECIDOS e no seu conhecimento de análise financeira, gere uma análise estruturada contendo os seguintes campos. NÃO ESPECULE OU "ALUCINE" informações que não possam ser comprovadas pelos dados. Seja objetivo e use uma linguagem profissional, como faria em um relatório para um comitê de investimentos.
        
        1.  **executiveSummary:** Um parágrafo curto no início resumindo os pontos mais importantes da performance do ativo no período (tendência geral, volatilidade, principais movimentos).
        2.  **trendAnalysis:** Descreva a tendência principal (alta, baixa, lateralidade). Identifique picos e vales significativos, citando as datas e valores. Se possível, conecte os movimentos a observações do usuário, se fornecidas.
        3.  **volatilityAnalysis:** Comente sobre a volatilidade do ativo no período. Foi um período estável ou instável? Compare o range de preço (diferença entre o máximo e o mínimo) com o preço médio.
        4.  **conclusion:** Feche com uma conclusão sobre o desempenho do ativo no período analisado e, se os dados permitirem, aponte um insight relevante (ex: "o ativo terminou o período em tendência de alta/baixa").
      `,
    }
  );


/**
 * Orquestra a geração do relatório de análise de ativos.
 * @param input Os dados de entrada para a geração do relatório.
 * @returns Uma promessa que resolve para a análise gerada pela IA.
 */
export const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (input: ReportInput) => {
    
    // Etapa 1: Buscar dados históricos reais do Firestore
    console.log(`[report-flow] Buscando dados históricos para ${input.assetId} no período...`);
    const historicalData: FirestoreQuote[] = await getCotacoesHistoricoPorRange(input.assetId, input.dateRange);

    if (historicalData.length === 0) {
        throw new Error('Nenhum dado histórico encontrado para o período e ativo selecionado.');
    }

    // Simplifica os dados para enviar para a IA, focando no essencial
    const simplifiedData = historicalData.map(d => ({
        data: d.data,
        valor: d.valor ?? d.ultimo,
    }));
    
    // Etapa 2: Chamar o prompt de IA com os dados de entrada e os dados históricos
    console.log('[report-flow] Invocando o modelo de linguagem com os dados...');
    const llmResponse = await reportGeneratorPrompt.generate({
        input: {
            ...input,
            // Converte os dados para uma string JSON para o prompt
            historicalData: JSON.stringify(simplifiedData, null, 2),
        },
    });
    
    const output = llmResponse.output();

    // Etapa 3: Retornar a saída estruturada ou um objeto vazio em caso de falha
    if (!output) {
      console.error("[report-flow] A resposta da IA não gerou uma saída estruturada válida.");
      throw new Error("A resposta da IA não gerou uma saída estruturada válida.");
    }
    
    console.log('[report-flow] Análise da IA gerada com sucesso.');
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
        return result;
    } catch (error: any) {
        console.error('[report-flow] Ocorreu um erro durante a geração do relatório:', error);
        const errorMessage = error.message || 'Ocorreu uma falha inesperada ao tentar gerar a análise. Por favor, tente novamente.';
        return {
             executiveSummary: `Erro: ${errorMessage}`,
             trendAnalysis: '',
             volatilityAnalysis: '',
             conclusion: '',
        }
    }
}
