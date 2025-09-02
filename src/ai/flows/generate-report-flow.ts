
'use server';
/**
 * @fileOverview A flow for generating reports with AI-powered analysis.
 *
 * - generateReport - Handles the report generation logic.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getUcsIndexValue, getCommodityPrices } from '@/lib/data-service';
import type { ChartData, CommodityPriceData } from '@/lib/types';


// --- Zod Schemas for Input and Output ---

const GenerateReportInputSchema = z.object({
  type: z.enum(['index_performance', 'asset_performance']),
  period: z.enum(['daily', 'monthly', 'yearly']),
  format: z.enum(['pdf', 'xlsx']),
  observations: z.string().optional().describe('User-provided observations to guide the AI analysis.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const PreviewDataSchema = z.object({
    reportTitle: z.string(),
    periodTitle: z.string(),
    analysisText: z.string(),
    ucsHistory: z.array(z.object({ time: z.string(), value: z.number() })),
    assets: z.array(z.object({ 
        name: z.string(), 
        price: z.number(), 
        change: z.number(),
        currency: z.string(),
    })),
});

const GenerateReportOutputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string().describe('The generated file content as a Base64 encoded string.'),
  mimeType: z.string(),
  previewData: PreviewDataSchema,
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;


const AnalysisPromptInputSchema = z.object({
    reportTitle: z.string(),
    periodTitle: z.string(),
    observations: z.string().optional(),
    ucsHistory: z.array(z.object({ time: z.string(), value: z.number() })),
    assets: z.array(z.object({ name: z.string(), price: z.number(), change: z.number() })),
});

// --- AI Prompt for Analysis ---

const analysisPrompt = ai.definePrompt({
    name: 'reportAnalysisPrompt',
    input: { schema: AnalysisPromptInputSchema },
    output: { schema: z.string() },
    prompt: `
        You are a financial analyst specializing in commodity markets and composite indices for an audience of financial experts, traders, and farmers in Brazil.
        Your task is to write an insightful, well-structured executive summary for a financial report. The tone should be professional, objective, and data-driven.

        **Report Details:**
        - Title: {{{reportTitle}}}
        - Period: {{{periodTitle}}}

        **Key Data:**
        - **UCS Index History:** {{json ucsHistory}}
        - **Underlying Assets Performance:** {{json assets}}

        {{#if observations}}
        **User's Focus/Observations to Address:**
        - {{{observations}}}
        {{/if}}

        **Your Task:**
        Based on all the provided data, generate a concise analytical summary (2-4 paragraphs) in Brazilian Portuguese.
        - **Paragraph 1: Overview.** Start with a clear overview of the index's performance (e.g., "O Índice UCS demonstrou resiliência, fechando o período com uma valorização de X%..."). Mention the general market sentiment reflected by the index movement.
        - **Paragraph 2: Key Drivers.** Identify and elaborate on the primary drivers behind the index's performance. Which assets were most influential (positively or negatively)? Connect asset movements to potential market factors (e.g., "A alta foi impulsionada principalmente pelo desempenho do milho, que subiu Y% em meio a preocupações com a quebra de safra no Sul...").
        - **Paragraph 3: Correlation and Outlook.** Briefly touch upon any notable correlations or divergences between assets. If the user provided observations, ensure they are addressed here. Conclude with a brief, neutral-to-cautious forward-looking statement (e.g., "A volatilidade no mercado de grãos deve continuar sendo um ponto de atenção para a trajetória do índice nas próximas semanas.").
        
        - **Crucially, DO NOT include a title or header like "Análise do Relatório".** Just provide the raw text of the analysis.
    `,
});


// --- PDF Generation Logic ---

async function generatePdfReport(title: string, period: string, analysis: string, ucsHistory: ChartData[], assets: CommodityPriceData[]): Promise<string> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.text(`Período: ${period}`, margin, yPos);
    yPos += 12;

    // AI Analysis Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise Executiva do Período', margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const analysisLines = doc.splitTextToSize(analysis, pageWidth - margin * 2);
    doc.text(analysisLines, margin, yPos);
    yPos += analysisLines.length * 5 + 10;

    // Index Performance Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico do Índice UCS', margin, yPos);
    yPos += 8;
    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Valor de Fechamento (R$)']],
        body: ucsHistory.map(d => [d.time, d.value.toFixed(4)]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
    }

    // Asset Performance Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance dos Ativos Subjacentes', margin, yPos);
    yPos += 8;
    autoTable(doc, {
        startY: yPos,
        head: [['Ativo', 'Moeda', 'Último Preço', 'Variação %']],
        body: assets.map(a => [a.name, a.currency, a.price.toFixed(4), `${a.change.toFixed(2)}%`]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });

    return doc.output('base64');
}


// --- XLSX (Excel) Generation Logic ---

async function generateXlsxReport(title: string, period: string, analysis: string, ucsHistory: ChartData[], assets: CommodityPriceData[]): Promise<string> {
  const wb = XLSX.utils.book_new();

  // --- Main Sheet with Analysis ---
  const wsMainData = [
    [title],
    [`Período: ${period}`],
    [],
    ['Análise Executiva do Período'],
    [analysis], // AI Generated text
    [], // Spacer
    ['Histórico do Índice UCS'],
    ['Data', 'Valor de Fechamento (R$)'],
    ...ucsHistory.map(d => [d.time, d.value]),
  ];
  const wsMain = XLSX.utils.aoa_to_sheet(wsMainData);
  
  // Custom styling for the analysis text cell
  const analysisCellStyle = {
      alignment: { wrapText: true, vertical: 'top' },
  };
  if (wsMain['A5']) {
    wsMain['A5'].s = analysisCellStyle;
  } else {
    wsMain['A5'] = { v: analysis, t: 's', s: analysisCellStyle };
  }
  
  // Merge cells for title and analysis
  wsMain['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Period
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // Analysis Title
    { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Analysis Text
  ];
  wsMain['!cols'] = [{ wch: 20 }, { wch: 25 }];
  wsMain['!rows'] = [{ hpt: 80, hpx: 80 }]; // Set height for analysis row
  XLSX.utils.book_append_sheet(wb, wsMain, 'Resumo e Índice');

  // --- Assets Sheet ---
  const wsAssetsData = [
    ['Performance dos Ativos Subjacentes'],
    [],
    ['Ativo', 'Ticker', 'Moeda', 'Último Preço', 'Variação %', 'Variação Absoluta', 'Última Atualização'],
    ...assets.map(a => [
        a.name, 
        a.ticker, 
        a.currency, 
        a.price, 
        a.change,
        a.absoluteChange,
        a.lastUpdated
    ]),
  ];
  const wsAssets = XLSX.utils.aoa_to_sheet(wsAssetsData);
  wsAssets['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsAssets, 'Ativos Subjacentes');
  
  // Generate Base64 content
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  return wbout;
}


export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  const generateReportFlow = ai.defineFlow(
    {
      name: 'generateReportFlow',
      inputSchema: GenerateReportInputSchema,
      outputSchema: GenerateReportOutputSchema,
    },
    async (input) => {
      const { type, period, format, observations } = input;
      
      // Determine interval and limit based on period
      const { interval, limit, periodTitle } = {
          daily: { interval: '1d' as const, limit: 30, periodTitle: 'Diário (Últimos 30 dias)' },
          monthly: { interval: '1wk' as const, limit: 12, periodTitle: 'Mensal (Últimos 12 meses)' },
          yearly: { interval: '1mo' as const, limit: 60, periodTitle: 'Anual (Últimos 5 anos)' },
      }[period];

      const reportTitle = type === 'index_performance' 
          ? 'Relatório de Performance do Índice UCS' 
          : 'Relatório de Performance dos Ativos Subjacentes';

      // Fetch data
      const [ucsData, assets] = await Promise.all([
          getUcsIndexValue(interval),
          getCommodityPrices()
      ]);
      const ucsHistory = ucsData.history.slice(-limit);
      
      const assetsForAnalysis = assets.map(a => ({ name: a.name, price: a.price, change: a.change }));

      // Generate AI analysis
      const analysisText = await analysisPrompt({
          reportTitle,
          periodTitle,
          ucsHistory,
          assets: assetsForAnalysis,
          observations
      });

      // Generate file
      let fileContent = '';
      let mimeType = '';
      const fileName = `relatorio_ucs_${type}_${period}.${format}`;

      if (format === 'pdf') {
        fileContent = await generatePdfReport(reportTitle, periodTitle, analysisText, ucsHistory, assets);
        mimeType = 'application/pdf';
      } else { // xlsx
        fileContent = await generateXlsxReport(reportTitle, periodTitle, analysisText, ucsHistory, assets);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      return { 
        fileName, 
        fileContent, 
        mimeType,
        previewData: {
          reportTitle,
          periodTitle,
          analysisText,
          ucsHistory,
          assets: assets.map(a => ({
            name: a.name,
            price: a.price,
            change: a.change,
            currency: a.currency,
          })),
        }
      };
    }
  );

  return await generateReportFlow(input);
}
