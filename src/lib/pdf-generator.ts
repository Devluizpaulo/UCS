

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

export interface DashboardPdfData {
    mainIndex?: CommodityPriceData;
    secondaryIndices: CommodityPriceData[];
    currencies: CommodityPriceData[];
    otherAssets: CommodityPriceData[];
    targetDate: Date;
}

const COLORS = {
  primary: '#16a34a', // green-600
  textPrimary: '#111827', // gray-900
  textSecondary: '#4b5563', // gray-600
  border: '#e5e7eb', // gray-200
  white: '#ffffff',
  kpi: {
    green: '#10b981', // emerald-500
    red: '#ef4444', // red-500
  },
  chart: {
    c1: '#3b82f6', // blue-500
    c2: '#f97316', // orange-500
    c3: '#8b5cf6', // violet-500
  }
};

// ===================================================================================
// === TEMPLATE EXECUTIVO ============================================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal-pageSize.getHeight();
    const margin = 40;
    let y = 50;

    // --- CABEÇALHO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('UCS INDEX', margin, y);

    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(1);
    doc.line(margin + 70, y, pageW - margin - 130, y);
    y += 40;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(COLORS.textPrimary);
    doc.text('Relatório Executivo', margin, y);
    y+= 28;
    doc.setFontSize(22);
    doc.setTextColor(COLORS.textSecondary);
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
    doc.setFont('helvetica', 'bold');
    doc.text('DATA DA ANÁLISE', pageW - margin - 110, 60);
    doc.setFontSize(14);
    doc.text(format(targetDate, "dd/MM/yyyy"), pageW - margin - 110, 75);
    y += 50;

    // --- BLOCOS DE KPI ---
    const drawKpiBlock = (title: string, value: string, change: string, isPositive: boolean, x: number, yPos: number, width: number) => {
        const icon = isPositive ? '📈' : '📉';
        const color = isPositive ? COLORS.kpi.green : COLORS.kpi.red;
        
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
        doc.setTextColor(color);
        doc.text(`${icon} ${change}`, x + 15, yPos + 65);
    };

    if (mainIndex) {
        const changeValue = typeof mainIndex.change === 'number' ? mainIndex.change : 0;
        drawKpiBlock(
            `Índice Principal: ${mainIndex.name}`,
            formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
            `${changeValue.toFixed(2)}%`,
            changeValue >= 0,
            margin, y, pageW - margin * 2
        );
        y += 100;
    }

    const kpiAssets = [...secondaryIndices, ...currencies];
    const kpiCardWidth = (pageW - (margin * 2) - 20) / 2;
    if (kpiAssets.length > 0) {
        const asset1 = kpiAssets[0];
        const change1 = typeof asset1.change === 'number' ? asset1.change : 0;
        drawKpiBlock(
            asset1.name,
            formatCurrency(asset1.price, asset1.currency, asset1.id),
            `${change1.toFixed(2)}%`,
            change1 >= 0,
            margin, y, kpiCardWidth
        );
    }
    if (kpiAssets.length > 1) {
        const asset2 = kpiAssets[1];
        const change2 = typeof asset2.change === 'number' ? asset2.change : 0;
        drawKpiBlock(
            asset2.name,
            formatCurrency(asset2.price, asset2.currency, asset2.id),
            `${change2.toFixed(2)}%`,
            change2 >= 0,
            margin + kpiCardWidth + 20, y, kpiCardWidth
        );
    }
    if (kpiAssets.length > 0) {
        y += 100;
    }

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
            body: otherAssets.map(asset => {
                const changeValue = typeof asset.change === 'number' ? asset.change : 0;
                return [
                    asset.name,
                    asset.category,
                    formatCurrency(asset.price, asset.currency, asset.id),
                    `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`
                ]
            }),
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, textColor: 255 },
            styles: { cellPadding: 6, fontSize: 10 },
            didParseCell: (data: any) => {
                if (data.column.index === 3 && data.section === 'body') {
                    const rawValue = data.cell.raw as string;
                    data.cell.styles.textColor = rawValue.startsWith('+') ? COLORS.kpi.green : COLORS.kpi.red;
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
        doc.text(`Confidencial | UCS Index`, margin, pageH - 25);
        doc.text(`Página ${i}`, pageW - margin, pageH - 25, { align: 'right' });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE DE COMPOSIÇÃO ========================================================
// ===================================================================================
const generateCompositionPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, otherAssets: components, targetDate } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    // --- CABEÇALHO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('ANÁLISE DE COMPOSIÇÃO', margin, y);
    y += 40;

    doc.setFontSize(24);
    doc.setTextColor(COLORS.textPrimary);
    doc.text(mainIndex?.name || 'Índice de Composição', margin, y);
    y += 24;
    doc.setFontSize(16);
    doc.setTextColor(COLORS.textSecondary);
    doc.text(`Dados de ${format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
    y += 50;

    // --- BLOCOS DE KPI DE COMPONENTES ---
    const drawCompositionKpiBlock = (title: string, value: string, percentage: string, x: number, yPos: number, width: number, color: string) => {
        const circleRadius = 30; // Aumentado
        doc.setDrawColor(COLORS.border);
        doc.roundedRect(x, yPos, width, 80, 8, 8, 'S');
    
        // Alinhamento do texto à esquerda
        const textBlockWidth = width - circleRadius * 2 - 30; // Espaço para o círculo e padding
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(title, x + 15, yPos + 30);
    
        doc.setFontSize(20);
        doc.setTextColor(COLORS.textPrimary);
        doc.text(value, x + 15, yPos + 55);
    
        // Círculo com porcentagem alinhado à direita
        const circleX = x + width - 15 - circleRadius;
        const circleY = yPos + 40; // Centralizado verticalmente
        doc.setFillColor(color);
        doc.circle(circleX, circleY, circleRadius, 'F');
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.white);
        doc.text(percentage, circleX, circleY, { align: 'center', baseline: 'middle' });
    };

    if (components && components.length > 0) {
        const kpiCardWidth = (pageW - (margin * 2) - ((components.length - 1) * 20)) / components.length;
        const chartColors = [COLORS.chart.c1, COLORS.chart.c2, COLORS.chart.c3];

        components.forEach((component, index) => {
            drawCompositionKpiBlock(
                component.name,
                formatCurrency(component.price, component.currency, component.id),
                `${component.change.toFixed(0)}%`,
                margin + (kpiCardWidth + 20) * index,
                y,
                kpiCardWidth,
                chartColors[index % chartColors.length]
            );
        });
        y += 100;
    }

    // --- VALOR TOTAL ---
    if(mainIndex) {
        doc.setFillColor(249, 250, 251); // gray-50
        doc.setDrawColor(COLORS.border);
        doc.roundedRect(margin, y, pageW - margin * 2, 50, 8, 8, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textSecondary);
        doc.text('Valor Total do Índice', margin + 20, y + 30);
        doc.setFontSize(22);
        doc.setTextColor(COLORS.textPrimary);
        doc.text(formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id), pageW - margin - 20, y + 30, { align: 'right' });
        y += 70;
    }

    // --- TABELA RESUMO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.textPrimary);
    doc.text('Resumo da Composição', margin, y);
    y += 20;

    if (components && components.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Componente', 'Valor', 'Participação (%)']],
            body: components.map(c => [c.name, formatCurrency(c.price, c.currency, c.id), `${c.change.toFixed(2)}%`]),
            theme: 'grid',
            headStyles: { fillColor: COLORS.textPrimary, textColor: 255 },
            styles: { cellPadding: 6, fontSize: 10 },
        });
        y = (doc as any).lastAutoTable.finalY;
    }

    // --- RODAPÉ ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Confidencial | UCS Index`, margin, pageH - 25);
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
): string => {
    try {
        if (!data || !data.targetDate || isNaN(data.targetDate.getTime())) {
            throw new Error('Dados inválidos ou data de destino ausente para a geração do PDF.');
        }
        
        let doc: jsPDF;
        const pageW = new jsPDF().internal.pageSize.getWidth();
        const pageH = new jsPDF().internal.pageSize.getHeight();
        switch (reportType) {
            case 'composition':
                doc = generateCompositionPdf(data);
                break;
            case 'executive':
            case 'asset-detail':
            case 'dashboard':
            case 'audit':
            case 'report':
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

