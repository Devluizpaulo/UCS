
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

const GenerateReportOutputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string().describe('The generated file content as a Base64 encoded string.'),
  mimeType: z.string(),
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
        You are a financial analyst specializing in commodity markets and composite indices.
        Your task is to write a brief, insightful, and well-structured summary for a financial report.

        **Report Details:**
        - Title: {{{reportTitle}}}
        - Period: {{{periodTitle}}}

        **Key Data:**
        - **UCS Index History:** {{json ucsHistory}}
        - **Underlying Assets Performance:** {{json assets}}

        {{#if observations}}
        **User's Focus/Observations:**
        - {{{observations}}}
        {{/if}}

        **Your Task:**
        Based on all the provided data and the user's observations (if any), generate a concise analytical summary (2-3 paragraphs).
        The summary should be written in Portuguese (Brazil).
        - Start with a clear overview of the index's performance during the period.
        - Highlight the key drivers (positive or negative) among the underlying assets.
        - If the user provided observations, make sure to address them in your analysis.
        - Maintain a professional and objective tone.
        - DO NOT include a title or header like "Análise do Relatório". Just provide the text of the analysis.
    `,
});


// --- Main Flow Definition ---

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
        monthly: { interval: '1mo' as const, limit: 12, periodTitle: 'Mensal (Últimos 12 meses)' },
        yearly: { interval: '1mo' as const, limit: 60, periodTitle: 'Anual (Últimos 5 anos)' },
    }[period];

    const reportTitle = type === 'index_performance' 
        ? 'Relatório de Performance do Índice UCS' 
        : 'Relatório de Performance dos Ativos Subjacentes';

    // Fetch data
    const [ucsIndex, assets] = await Promise.all([
        getUcsIndexValue(interval),
        getCommodityPrices()
    ]);
    const ucsHistory = ucsIndex.history.slice(-limit);

    // Generate AI analysis
    const analysisText = await analysisPrompt({
        reportTitle,
        periodTitle,
        ucsHistory,
        assets,
        observations
    });

    // Generate file
    let fileContent = '';
    let mimeType = '';
    const fileName = `report_${type}_${period}.${format}`;

    if (format === 'pdf') {
      fileContent = await generatePdfReport(reportTitle, periodTitle, analysisText, ucsHistory, assets);
      mimeType = 'application/pdf';
    } else { // xlsx
      fileContent = await generateXlsxReport(reportTitle, periodTitle, analysisText, ucsHistory, assets);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return { fileName, fileContent, mimeType };
  }
);


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
    doc.text('Análise do Período', margin, yPos);
    yPos += 6;
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
    ['Análise do Período'],
    [analysis], // AI Generated text
    [], // Spacer
    ['Histórico do Índice UCS'],
    ['Data', 'Valor de Fechamento (R$)'],
    ...ucsHistory.map(d => [d.time, d.value]),
  ];
  const wsMain = XLSX.utils.aoa_to_sheet(wsMainData);
  // Merge cells for title and analysis
  wsMain['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Period
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // Analysis Title
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }, // Analysis Text
  ];
  wsMain['!cols'] = [{ wch: 20 }, { wch: 25 }];
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
  return await generateReportFlow(input);
}
