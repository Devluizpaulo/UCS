
'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData } from './types';
import { formatCurrency } from './formatters';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

type PdfTemplate = 'simple' | 'complete' | 'executive';

export interface DashboardPdfData {
    mainIndex?: CommodityPriceData;
    secondaryIndices: CommodityPriceData[];
    currencies: CommodityPriceData[];
    otherAssets: CommodityPriceData[];
    targetDate: Date;
}

// ===================================================================================
// === TEMPLATE SIMPLES =============================================================
// ===================================================================================
const generateSimpleDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { mainIndex, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('Relatório de Cotações Simplificado', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${formattedDate}`, 14, 30);

    if (mainIndex) {
        doc.autoTable({
            startY: 40,
            head: [['Índice Principal', 'Valor', 'Variação']],
            body: [[
                mainIndex.name, 
                formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
                `${mainIndex.change >= 0 ? '+' : ''}${mainIndex.change.toFixed(2)}%`
            ]],
        });
    }

    if (otherAssets.length > 0) {
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Ativo', 'Preço', 'Variação']],
            body: otherAssets.map(asset => [
                asset.name,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`
            ]),
        });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE COMPLETO ============================================================
// ===================================================================================
const generateCompleteDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const generationDate = format(new Date(), "dd/MM/yyyy HH:mm");
    let finalY = 20;

    doc.setFontSize(20);
    doc.text('Painel de Cotações Completo', 14, finalY);
    finalY += 10;
    doc.setFontSize(12);
    doc.text(`Dados para: ${formattedDate}`, 14, finalY);
    finalY += 15;

    const generateSection = (title: string, assets: CommodityPriceData[]) => {
      if (assets.length === 0) return;
      doc.autoTable({
        startY: finalY,
        head: [[title, 'Último Preço', 'Variação (24h)', 'Variação Absoluta']],
        body: assets.map(asset => [
            asset.name, 
            formatCurrency(asset.price, asset.currency, asset.id), 
            `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`,
            `${asset.absoluteChange >= 0 ? '+' : ''}${asset.absoluteChange.toFixed(2)}`
        ]),
        didDrawPage: (data: any) => { finalY = data.cursor?.y || finalY; }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    };
    
    if(mainIndex) generateSection('Índice Principal', [mainIndex]);
    if(secondaryIndices.length > 0) generateSection('Índices Secundários', secondaryIndices);
    if(currencies.length > 0) generateSection('Moedas', currencies);
    if(otherAssets.length > 0) generateSection('Commodities e Outros Ativos', otherAssets);
    
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(
        `Página ${i} de ${pageCount} | Relatório gerado em ${generationDate} | UCS Index`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE EXECUTIVO ===========================================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF('p', 'pt') as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 60;

    // --- CAPA / CABEÇALHO ---
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, 180, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('UCS INDEX — RELATÓRIO EXECUTIVO', margin, y);
    y += 40;

    doc.setFontSize(32);
    doc.setTextColor(17, 24, 39);
    doc.text('Análise de Mercado e Performance', margin, y);
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`Data da Análise: ${formattedDate}`, margin, y);
    y += 50;

    // --- MÉTRICAS PRINCIPAIS (KPIs) ---
    if (mainIndex) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Índice Principal de Performance', margin, y);
        y += 20;

        const kpiY = y;
        const mainChangePositive = mainIndex.change >= 0;
        const kpiColor = mainChangePositive ? [4, 120, 87] : [185, 28, 28];
        const kpiBgColor = mainChangePositive ? [209, 250, 229] : [254, 226, 226];

        doc.setFillColor(kpiBgColor[0], kpiBgColor[1], kpiBgColor[2]);
        doc.roundedRect(margin, kpiY, pageW - margin * 2, 70, 8, 8, 'F');
        doc.setDrawColor(kpiColor[0], kpiColor[1], kpiColor[2]);
        doc.setLineWidth(1);
        doc.roundedRect(margin, kpiY, pageW - margin * 2, 70, 8, 8, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(17, 24, 39);
        doc.text(mainIndex.name, margin + 20, kpiY + 30);

        doc.setFontSize(28);
        doc.setTextColor(kpiColor[0], kpiColor[1], kpiColor[2]);
        doc.text(`${mainChangePositive ? '+' : ''}${mainIndex.change.toFixed(2)}%`, pageW - margin - 150, kpiY + 45, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        doc.text(formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id), pageW - margin - 20, kpiY + 45, { align: 'right' });
        y += 90;
    }
    
    // --- TABELAS DE DADOS ---
    const generateTable = (title: string, assets: CommodityPriceData[], startY: number) => {
        if (assets.length === 0) return startY;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text(title, margin, startY);

        doc.autoTable({
            startY: startY + 15,
            head: [['Ativo', 'Valor', 'Variação (24h)']],
            body: assets.map(asset => [
                asset.name,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55], textColor: 255 },
            styles: { cellPadding: 6 },
            didParseCell: (data: any) => {
                if (data.column.index === 2 && data.section === 'body') {
                    const value = data.cell.raw as string;
                    data.cell.styles.textColor = value.startsWith('+') ? [5, 150, 105] : [199, 24, 24];
                }
            }
        });
        return (doc as any).lastAutoTable.finalY + 30;
    };

    y = generateTable('Índices Secundários e Moedas', [...secondaryIndices, ...currencies], y);
    y = generateTable('Commodities e Outros Ativos', otherAssets, y);

    // --- RODAPÉ ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Confidencial | UCS Index`, margin, pageH - 25);
        doc.text(`Página ${i} de ${pageCount}`, pageW - margin, pageH - 25, { align: 'right' });
    }

    return doc;
};


// ===================================================================================
// === FUNÇÃO PRINCIPAL DE GERAÇÃO =================================================
// ===================================================================================
export const generatePdf = (
    reportType: string, 
    data: DashboardPdfData, 
    template: PdfTemplate = 'complete'
): string => {
    try {
        let doc: jsPDF;
    
        // Validação de dados de entrada
        if (!data || !data.targetDate || isNaN(data.targetDate.getTime())) {
            throw new Error('Dados inválidos ou data de destino ausente para a geração do PDF.');
        }

        switch (template) {
            case 'simple':
                doc = generateSimpleDashboardPdf(data);
                break;
            case 'executive':
                doc = generateExecutiveDashboardPdf(data);
                break;
            case 'complete':
            default:
                doc = generateCompleteDashboardPdf(data);
                break;
        }
    
        return doc.output('datauristring');

    } catch (error) {
        console.error('Erro na geração do PDF:', error);
        throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};
