
'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData, DashboardPdfData } from './types';
import { formatCurrency } from './formatters';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

// ===================================================================================
// === TIPOS E INTERFACES ==========================================================
// ===================================================================================

type PdfTemplate = 'simple' | 'commercial' | 'executive';

// ===================================================================================
// === TEMPLATE SIMPLES ============================================================
// ===================================================================================
const generateSimpleDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Relatório Simplificado de Ativos', margin, y);
    y += 25;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Data de referência: ${formattedDate}`, margin, y);
    y += 40;

    if (mainIndex) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Índice Principal', margin, y);
        y += 15;
        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Valor', 'Variação']],
            body: [[
                mainIndex.name,
                formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
                `${mainIndex.change >= 0 ? '+' : ''}${mainIndex.change.toFixed(2)}%`
            ]],
            theme: 'striped',
        });
        y = (doc as any).lastAutoTable.finalY + 30;
    }

    const allOtherAssets = [...secondaryIndices, ...currencies, ...otherAssets];
    if (allOtherAssets.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Demais Ativos e Moedas', margin, y);
        y += 15;
        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Categoria', 'Valor', 'Variação']],
            body: allOtherAssets.map(asset => [
                asset.name,
                asset.category,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`
            ]),
            theme: 'striped',
        });
    }

    // Rodapé
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${doc.internal.pages.length}`, pageW / 2, pageH - 20, { align: 'center' });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE COMERCIAL ==========================================================
// ===================================================================================
const generateCommercialDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const generationDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('UCS INDEX CORPORATION', margin, y);
    y += 20;

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 40;

    doc.setFontSize(32);
    doc.setTextColor(17, 24, 39);
    doc.text('Relatório Comercial de Mercado', margin, y);
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Data de Referência: ${formattedDate}`, margin, y);
    y += 40;

    const generateSection = (title: string, assets: CommodityPriceData[]) => {
        if (assets.length === 0) return;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, y);
        y += 20;

        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Valor Atual', 'Variação (24h)', 'Moeda', 'Categoria']],
            body: assets.map(asset => [
                asset.name,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`,
                asset.currency,
                asset.category,
            ]),
            theme: 'grid',
            headStyles: { fillColor: [30, 64, 175], textColor: 255 },
            didParseCell: (data: any) => {
                if (data.column.index === 2 && data.section === 'body') {
                    data.cell.styles.textColor = data.cell.raw.startsWith('+') ? [22, 163, 74] : [220, 38, 38];
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY + 30;
    };
    
    if (mainIndex) generateSection('Índice Principal', [mainIndex]);
    generateSection('Índices Secundários', secondaryIndices);
    generateSection('Moedas e Câmbio', currencies);
    generateSection('Commodities e Outros Ativos', otherAssets);
    
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Página ${i} | Gerado em ${generationDate}`, pageW / 2, pageH - 20, { align: 'center' });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE EXECUTIVO (RECONSTRUÍDO) =============================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    // --- CAPA / CABEÇALHO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94); // green-500
    doc.text('UCS INDEX', margin, y);

    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(1);
    doc.line(margin + 70, y, pageW - margin - 100, y);
    y += 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(17, 24, 39); // gray-900
    doc.text('Relatório Executivo', margin, y);
    y+= 28;
    doc.setFontSize(22);
    doc.setTextColor(55, 65, 81); // gray-600
    doc.text('Análise de Mercado e Performance', margin, y);
    
    // Bloco de data verde
    doc.setFillColor(34, 197, 94); // green-500
    doc.roundedRect(pageW - margin - 120, 40, 120, 50, 5, 5, 'F');
    doc.triangle(
        pageW - margin - 120, 90,
        pageW - margin - 100, 90,
        pageW - margin - 120, 70,
        'F'
    );
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Data da Análise', pageW - margin - 110, 60);
    doc.setFontSize(14);
    doc.text(format(targetDate, "dd/MM/yyyy"), pageW - margin - 110, 75);
    y += 50;

    // --- BLOCOS DE KPI ---
    const drawKpiBlock = (title: string, value: string, change: string, isPositive: boolean, x: number, yPos: number, width: number) => {
        const icon = isPositive ? '📈' : '📉';
        const color = isPositive ? [34, 197, 94] : [239, 68, 68];
        
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x, yPos, width, 80, 8, 8, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(title, x + 15, yPos + 20);

        doc.setFontSize(24);
        doc.setTextColor(17, 24, 39);
        doc.text(value, x + 15, yPos + 45);

        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`${icon} ${change}`, x + 15, yPos + 65);
    };

    if (mainIndex) {
        drawKpiBlock(
            `Índice Principal: ${mainIndex.name}`,
            formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
            `${mainIndex.change.toFixed(2)}%`,
            mainIndex.change >= 0,
            margin, y, pageW - margin * 2
        );
        y += 100;
    }

    const kpiAssets = [...secondaryIndices, ...currencies];
    const kpiCardWidth = (pageW - (margin * 2) - 20) / 2;
    if (kpiAssets.length > 0) {
        drawKpiBlock(
            kpiAssets[0].name,
            formatCurrency(kpiAssets[0].price, kpiAssets[0].currency, kpiAssets[0].id),
            `${kpiAssets[0].change.toFixed(2)}%`,
            kpiAssets[0].change >= 0,
            margin, y, kpiCardWidth
        );
    }
    if (kpiAssets.length > 1) {
        drawKpiBlock(
            kpiAssets[1].name,
            formatCurrency(kpiAssets[1].price, kpiAssets[1].currency, kpiAssets[1].id),
            `${kpiAssets[1].change.toFixed(2)}%`,
            kpiAssets[1].change >= 0,
            margin + kpiCardWidth + 20, y, kpiCardWidth
        );
    }
    y += 100;

    // --- TABELA DE ATIVOS ---
    if (otherAssets.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Performance de Commodities e Outros Ativos', margin, y);
        y += 20;

        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Categoria', 'Valor Atual', 'Variação (24h)']],
            body: otherAssets.map(asset => [
                asset.name,
                asset.category,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94], textColor: 255 },
            styles: { cellPadding: 6, fontSize: 10 },
            didParseCell: (data: any) => {
                if (data.column.index === 3 && data.section === 'body') {
                    data.cell.styles.textColor = data.cell.raw.startsWith('+') ? [22, 163, 74] : [220, 38, 38];
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY;
    }

    // --- RODAPÉ ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('Relatório Confidencial', margin, pageH - 25);
        doc.text(`Página ${i}`, pageW - margin, pageH - 25, { align: 'right' });
    }

    return doc;
};


// ===================================================================================
// === FUNÇÃO PRINCIPAL DE GERAÇÃO =================================================
// ===================================================================================
export const generatePdf = (
    reportType: string, 
    data: DashboardPdfData, 
    template: PdfTemplate = 'executive'
): string => {
    try {
        let doc: jsPDF;
    
        if (!data || !data.targetDate || isNaN(data.targetDate.getTime())) {
            throw new Error('Dados inválidos ou data de destino ausente para a geração do PDF.');
        }

        switch (template) {
            case 'simple':
                doc = generateSimpleDashboardPdf(data);
                break;
            case 'commercial':
                doc = generateCommercialDashboardPdf(data);
                break;
            case 'executive':
            default:
                doc = generateExecutiveDashboardPdf(data);
                break;
        }
    
        return doc.output('datauristring');

    } catch (error) {
        console.error('Erro na geração do PDF:', error);
        throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};
