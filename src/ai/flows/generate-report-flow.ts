
'use server';
/**
 * @fileOverview A flow for generating reports in various formats (PDF, XLSX).
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
import { getAssetHistoricalData, getUcsIndexValue, getCommodityPrices } from '@/lib/data-service';
import type { HistoricalQuote } from '@/lib/types';
import { COMMODITY_TICKER_MAP } from '@/lib/yahoo-finance-config-data';


// --- Zod Schemas for Input and Output ---

const GenerateReportInputSchema = z.object({
  type: z.enum(['index_performance', 'asset_performance']),
  period: z.enum(['daily', 'monthly', 'yearly']),
  format: z.enum(['pdf', 'xlsx']),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string().describe('The generated file content as a Base64 encoded string.'),
  mimeType: z.string(),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;


// --- Main Flow Definition ---

export const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { type, period, format } = input;
    const fileName = `report_${type}_${period}.${format}`;
    let fileContent = '';
    let mimeType = '';

    // Determine interval and limit based on period
    const { interval, limit, periodTitle } = {
        daily: { interval: '1d', limit: 30, periodTitle: 'Diário (Últimos 30 dias)' },
        monthly: { interval: '1mo', limit: 12, periodTitle: 'Mensal (Últimos 12 meses)' },
        yearly: { interval: '1mo', limit: 60, periodTitle: 'Anual (Últimos 5 anos)' },
    }[period];

    // Fetch data based on report type
    const reportTitle = type === 'index_performance' 
        ? 'Relatório de Performance do Índice UCS' 
        : 'Relatório de Performance dos Ativos Subjacentes';

    const [ucsIndex, assets] = await Promise.all([
        getUcsIndexValue(interval),
        getCommodityPrices()
    ]);
    const ucsHistory = ucsIndex.history.slice(-limit);

    // Generate file based on format
    if (format === 'pdf') {
      fileContent = await generatePdfReport(reportTitle, periodTitle, ucsHistory, assets);
      mimeType = 'application/pdf';
    } else { // xlsx
      fileContent = await generateXlsxReport(reportTitle, periodTitle, ucsHistory, assets);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return { fileName, fileContent, mimeType };
  }
);


// --- PDF Generation Logic ---

async function generatePdfReport(title: string, period: string, ucsHistory: any[], assets: any[]): Promise<string> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.text(`Período: ${period}`, 14, yPos);
    yPos += 15;

    // Index Performance Table
    doc.setFontSize(14);
    doc.text('Histórico do Índice UCS', 14, yPos);
    yPos += 8;
    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Valor de Fechamento (R$)']],
        body: ucsHistory.map(d => [d.time, d.value.toFixed(4)]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Check for page break
    if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
    }

    // Asset Performance Table
    doc.setFontSize(14);
    doc.text('Performance dos Ativos Subjacentes', 14, yPos);
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

async function generateXlsxReport(title: string, period: string, ucsHistory: any[], assets: any[]): Promise<string> {
  const wb = XLSX.utils.book_new();

  // Index Sheet
  const wsIndexData = [
    [title],
    [`Período: ${period}`],
    [],
    ['Histórico do Índice UCS'],
    ['Data', 'Valor de Fechamento (R$)'],
    ...ucsHistory.map(d => [d.time, d.value]),
  ];
  const wsIndex = XLSX.utils.aoa_to_sheet(wsIndexData);
  wsIndex['!cols'] = [{ wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsIndex, 'Índice UCS');

  // Assets Sheet
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

// Export a wrapper function for client-side use
export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return await generateReportFlow(input);
}
