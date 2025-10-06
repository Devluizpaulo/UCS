
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

// Função utilitária para configurar codificação correta
const configurePdfEncoding = (doc: jsPDFWithAutoTable, title: string, subject: string) => {
    // Configurar propriedades básicas
    doc.setProperties({
        title: title,
        subject: subject,
        author: 'UCS Index Corporation',
        creator: 'UCS System'
    });
    
    // Usar fonte padrão que funciona bem com caracteres especiais
    doc.setFont('helvetica', 'normal');
    
    return doc;
};


type PdfTemplate = 'simple' | 'commercial' | 'executive';

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
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    }) as jsPDFWithAutoTable;
    
    // Configurar codificação para caracteres especiais
    configurePdfEncoding(doc, 'Relatório Simplificado UCS', 'Análise Simplificada de Mercado');
    
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 40;

    // --- CABEÇALHO MELHORADO ---
    doc.setFillColor('#f8fafc'); // slate-50
    doc.rect(0, 0, pageW, 80, 'F');
    
    doc.setTextColor('#1e293b'); // slate-800
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 RELATÓRIO SIMPLIFICADO', margin, y);
    y += 30;

    doc.setTextColor('#64748b'); // slate-500
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formattedDate}`, margin, y);
    y += 40;

    // --- ÍNDICE PRINCIPAL ---
    if (mainIndex) {
        doc.setFillColor('#3b82f6'); // blue-500
        doc.roundedRect(margin, y, pageW - (margin * 2), 30, 5, 5, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('🎯 ÍNDICE PRINCIPAL', margin + 15, y + 20);
        y += 45;

        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Valor', 'Variação', 'Status']],
            body: [[
                mainIndex.name,
                formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
                `${mainIndex.change >= 0 ? '+' : ''}${mainIndex.change.toFixed(2)}%`,
                mainIndex.change >= 0 ? '📈 Alta' : '📉 Baixa'
            ]],
            theme: 'grid',
            headStyles: { 
                fillColor: '#1e40af', 
                fontStyle: 'bold',
                textColor: '#ffffff'
            },
            styles: { 
                cellPadding: 8, 
                fontSize: 11 
            },
            didParseCell: (data: any) => {
                if (data.column.index === 2 && data.section === 'body') {
                    const cellValue = data.cell.raw as string;
                    if(cellValue.startsWith('+')) {
                        data.cell.styles.textColor = '#16a34a';
                    } else if (cellValue.startsWith('-')) {
                        data.cell.styles.textColor = '#dc2626';
                    }
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY + 25;
    }

    // --- RESUMO GERAL ---
    const allAssets = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean);
    const positiveAssets = allAssets.filter(asset => asset!.change > 0).length;
    const negativeAssets = allAssets.filter(asset => asset!.change < 0).length;
    const avgChange = allAssets.length > 0 ? 
        allAssets.reduce((sum, asset) => sum + asset!.change, 0) / allAssets.length : 0;

    doc.setFillColor('#f1f5f9'); // slate-100
    doc.roundedRect(margin, y, pageW - (margin * 2), 25, 5, 5, 'F');
    
    doc.setTextColor('#1e293b'); // slate-800
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 RESUMO GERAL', margin + 15, y + 17);
    y += 35;

    const summaryData = [
        ['Total de Ativos', `${allAssets.length} ativos`],
        ['Ativos em Alta', `${positiveAssets} ativos`],
        ['Ativos em Baixa', `${negativeAssets} ativos`],
        ['Performance Média', `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`]
    ];

    doc.autoTable({
        startY: y,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'striped',
        headStyles: { 
            fillColor: '#64748b', 
            fontStyle: 'bold',
            textColor: '#ffffff'
        },
        styles: { 
            cellPadding: 6, 
            fontSize: 10 
        }
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // --- OUTROS ATIVOS ---
    if (otherAssets.length > 0) {
        doc.setFillColor('#f1f5f9'); // slate-100
        doc.roundedRect(margin, y, pageW - (margin * 2), 25, 5, 5, 'F');
        
        doc.setTextColor('#1e293b'); // slate-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('💼 OUTROS ATIVOS', margin + 15, y + 17);
        y += 35;

        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Valor', 'Variação', 'Status']],
            body: otherAssets.slice(0, 10).map(asset => [
                asset.name,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`,
                asset.change >= 0 ? '📈 Alta' : '📉 Baixa'
            ]),
            theme: 'striped',
            headStyles: { 
                fillColor: '#64748b', 
                fontStyle: 'bold',
                textColor: '#ffffff'
            },
            styles: { 
                cellPadding: 6, 
                fontSize: 10 
            },
            didParseCell: (data: any) => {
                if (data.column.index === 2 && data.section === 'body') {
                    const cellValue = data.cell.raw as string;
                    if(cellValue.startsWith('+')) {
                        data.cell.styles.textColor = '#16a34a';
                    } else if (cellValue.startsWith('-')) {
                        data.cell.styles.textColor = '#dc2626';
                    }
                }
            }
        });
    }

    // --- RODAPÉ ---
    const finalY = pageH - 30;
    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(1);
    doc.line(margin, finalY, pageW - margin, finalY);
    
    doc.setTextColor('#64748b');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('UCS Index - Relatório Simplificado | Análise de Mercado', pageW / 2, finalY + 15, { align: 'center' });

    return doc;
};


// ===================================================================================
// === TEMPLATE COMPLETO ============================================================
// ===================================================================================
const generateCommercialDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    }) as jsPDFWithAutoTable;
    
    // Configurar codificação para caracteres especiais
    configurePdfEncoding(doc, 'Relatório Comercial UCS', 'Análise Comercial de Mercado');
    
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const generationDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 60;

    // --- CABEÇALHO COMERCIAL ---
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, 200, 'F');
    
    // Logo/Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('UCS INDEX CORPORATION', margin, y);
    y += 20;

    // Linha separadora
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 30;

    // Título principal
    doc.setFontSize(36);
    doc.setTextColor(17, 24, 39);
    doc.text('Relatório Comercial de', margin, y);
    y += 40;
    
    doc.setFontSize(42);
    doc.setTextColor(59, 130, 246);
    doc.text('Análise de Mercado', margin, y);
    y += 50;

    // Informações do período
    doc.setFontSize(16);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período de Análise: ${formattedDate}`, margin, y);
    y += 25;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Relatório gerado em: ${generationDate}`, margin, y);
    y += 40;

    // --- RESUMO EXECUTIVO ---
    const allAssets = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean);
    const positiveAssets = allAssets.filter(asset => asset!.change > 0).length;
    const negativeAssets = allAssets.filter(asset => asset!.change < 0).length;
    const avgChange = allAssets.length > 0 ? 
        allAssets.reduce((sum, asset) => sum + asset!.change, 0) / allAssets.length : 0;

    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, y, pageW - (margin * 2), 35, 8, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 RESUMO EXECUTIVO', margin + 20, y + 25);
    y += 50;

    const summaryData = [
        ['Total de Ativos Monitorados', `${allAssets.length} ativos`],
        ['Ativos com Performance Positiva', `${positiveAssets} ativos (${((positiveAssets/allAssets.length)*100).toFixed(1)}%)`],
        ['Ativos com Performance Negativa', `${negativeAssets} ativos (${((negativeAssets/allAssets.length)*100).toFixed(1)}%)`],
        ['Performance Média do Portfolio', `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`],
        ['Data de Referência', formattedDate]
    ];

    doc.autoTable({
        startY: y,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 64, 175], 
            fontStyle: 'bold',
            textColor: [255, 255, 255]
        },
        styles: { 
            cellPadding: 8, 
            fontSize: 11 
        }
    });
    y = (doc as any).lastAutoTable.finalY + 30;

    // --- SEÇÕES DINÂMICAS MELHORADAS ---
    const generateSection = (title: string, assets: CommodityPriceData[], icon: string) => {
        if (assets.length === 0) return;
        
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, y, pageW - (margin * 2), 30, 6, 6, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${icon} ${title}`, margin + 20, y + 20);
        y += 40;

        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Valor Atual', 'Variação', 'Moeda', 'Categoria', 'Status']],
            body: assets.map(asset => [
                asset.name,
                formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`,
                asset.currency,
                asset.category,
                asset.change >= 0 ? '📈 Alta' : '📉 Baixa'
            ]),
            theme: 'striped',
            headStyles: { 
                fillColor: [59, 130, 246], 
                fontStyle: 'bold',
                textColor: [255, 255, 255]
            },
            styles: { 
                cellPadding: 6, 
                fontSize: 10 
            },
            didParseCell: (data: any) => {
                if (data.column.index === 2 && data.section === 'body') {
                    const cellValue = data.cell.raw as string;
                    if(cellValue.startsWith('+')) {
                        data.cell.styles.textColor = [22, 163, 74];
                    } else if (cellValue.startsWith('-')) {
                        data.cell.styles.textColor = [220, 38, 38];
                    }
                }
            }
        });
        
        y = (doc as any).lastAutoTable.finalY + 25;
    };
    
    if(mainIndex) generateSection('Índice Principal', [mainIndex], '🎯');
    if(secondaryIndices.length > 0) generateSection('Índices Secundários', secondaryIndices, '📊');
    if(currencies.length > 0) generateSection('Moedas e Câmbio', currencies, '💱');
    if(otherAssets.length > 0) generateSection('Commodities e Outros Ativos', otherAssets, '💼');
    
    // --- RODAPÉ MELHORADO ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
      
      // Texto do rodapé
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount} | Relatório gerado em ${generationDate} | UCS Index Corporation`,
        pageW / 2,
        pageH - 15,
        { align: 'center' }
      );
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE EXECUTIVO ===========================================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    }) as jsPDFWithAutoTable;
    
    // Configurar codificação para caracteres especiais
    configurePdfEncoding(doc, 'Relatório Executivo UCS', 'Análise Executiva de Mercado');
    
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
    template: PdfTemplate = 'executive'
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



