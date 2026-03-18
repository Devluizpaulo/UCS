
'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData, DashboardPdfData, MarketInsight, PerformanceMetric, RiskAnalysis, CustomSection } from './types';
import { formatCurrency } from './formatters';
import type { ReportOutput } from '@/ai/flows/report-flow';


// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const COLORS = {
  primary: '#16a34a', // green-600
  textPrimary: '#1f2937', // gray-800
  textSecondary: '#4b5563', // gray-600
  border: '#e5e7eb', // gray-200
  white: '#ffffff',
  kpi: {
    green: '#10b981', // emerald-500
    red: '#ef4444', // red-500
    blue: '#3b82f6', // blue-500
    yellow: '#f59e0b', // amber-500
  },
  chart: {
    c1: '#2563eb', // blue-600
    c2: '#16a34a', // green-600
    c3: '#f97316', // orange-500
    c4: '#8b5cf6', // violet-500
    c5: '#ef4444', // red-500
  },
  risk: {
    low: '#10b981', // emerald-500
    medium: '#f59e0b', // amber-500
    high: '#ef4444', // red-500
  },
  insight: {
    positive: '#10b981', // emerald-500
    negative: '#ef4444', // red-500
    neutral: '#6b7280', // gray-500
  }
};

// Uses external logo when provided in reportMeta.logoDataUrl, otherwise falls back to BMV logo
const drawLogo = (doc: jsPDF, data: DashboardPdfData, x: number, y: number, width: number = 40, height: number = 20): boolean => {
  try {
    const src = data.reportMeta?.logoDataUrl;
    if (src && typeof src === 'string') {
      const format = src.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(src, format as any, x, y, width, height, undefined, 'FAST');
      return true;
    }
  } catch {}
  // Try static logo from public/image/BMV.png
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/image/BMV.png';
    if ((img as any).complete) {
      doc.addImage(img as any, 'PNG', x, y, width, height, undefined, 'FAST');
      return true;
    }
  } catch {}
  return addBMVLogo(doc, x, y, width, height);
};

 

// Função para adicionar o logo BMV nos PDFs
const addBMVLogo = (doc: jsPDF, x: number, y: number, width: number = 40, height: number = 20) => {
  try {
    // Criar o logo BMV como um retângulo preto com texto branco
    // Background preto
    doc.setFillColor(0, 0, 0); // Preto
    doc.roundedRect(x, y, width, height, 4, 4, 'F');
    
    // Texto "bmv" em branco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255); // Branco
    doc.text('bmv', x + width/2, y + height/2 + 4, { align: 'center' });
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar logo BMV:', error);
    return false;
  }
};
// ===================================================================================
// === TEMPLATE DE ANÁLISE GERADA PELA IA ============================================
// ===================================================================================
const generateAiAnalysisPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, targetDate, aiReportData } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    let y = 60;

    // --- CABEÇALHO ---
    doc.setFillColor(34, 197, 94); // green-500
    doc.roundedRect(0, 0, pageW, 100, 0, 0, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('UCS INDEX', margin, 35);
    doc.setFontSize(22);
    doc.text('Relatório de Análise com IA', margin, 65);

    // Data no canto superior direito
    doc.setFontSize(10);
    doc.text(`Ativo Analisado: ${mainIndex?.name || 'N/A'}`, pageW - margin - 200, 35);
    doc.text(`Período: ${format(targetDate, "dd/MM/yyyy")}`, pageW - margin - 200, 50);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin - 200, 65);
    
    y = 130;

    // Sumário (simples)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(COLORS.textPrimary);
    doc.text('Sumário', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(COLORS.textSecondary);
    ['Resumo Executivo','Analise de Tendencia','Analise de Volatilidade','Conclusao'].forEach((item, i) => {
        doc.text(`• ${item}`, margin, y + i * 14);
    });
    y += 70;

    if (!aiReportData) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.textSecondary);
        doc.text('Dados da análise de IA não encontrados.', margin, y);
        // --- RODAPÉ: USO INTERNO ---
    for (let i = 1; i <= (doc as any).internal.pages.length; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 46, pageW - margin, pageH - 46);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text('Uso Interno - Documento Confidencial', margin, pageH - 30);
        doc.text(`Página ${i}`, pageW - margin, pageH - 30, { align: 'right' });
    }
    return doc;
    }

    // --- FUNÇÃO PARA DESENHAR SEÇÃO ---
    const drawSection = (title: string, content: string) => {
        if (y > doc.internal.pageSize.getHeight() - 150) {
            doc.addPage();
            y = 60;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textPrimary);
        doc.text(title, margin, y);
        y += 20;

        doc.setFillColor(249, 250, 251); // gray-50
        doc.setDrawColor(COLORS.border);
        const textLines = doc.splitTextToSize(content, pageW - margin * 2 - 40);
        const rectHeight = textLines.length * 12 + 40;
        doc.roundedRect(margin, y, pageW - margin * 2, rectHeight, 8, 8, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(textLines, margin + 20, y + 25);
        y += rectHeight + 25;
    };
    
    // --- RENDERIZA AS SEÇÕES DO RELATÓRIO ---
    drawSection('Resumo Executivo', aiReportData.executiveSummary);
    drawSection('Analise de Tendencia', aiReportData.trendAnalysis);
    drawSection('Analise de Volatilidade', aiReportData.volatilityAnalysis);
    drawSection('Conclusao', aiReportData.conclusion);
    
    // --- RODAPÉ ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, doc.internal.pageSize.getHeight() - 46, pageW - margin, doc.internal.pageSize.getHeight() - 46);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Confidencial | UCS Index - Relatório de IA`, margin, doc.internal.pageSize.getHeight() - 32);
        doc.text(`Uso Interno - Não distribuir sem autorização`, margin, doc.internal.pageSize.getHeight() - 18);
        doc.text(`Página ${i}`, pageW - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE EXECUTIVO ============================================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, historicalTable, targetDate } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    // --- CABEÇALHO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text('UCS INDEX', margin, y);

    // Logo no lado direito (externa se definida, senão BMV)
    drawLogo(doc, data, pageW - margin - 50, y - 10, 50, 25);

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
        doc.text(change, x + 15, yPos + 65);
    };

    if (mainIndex) {
        const changeValue = typeof mainIndex.change === 'number' ? mainIndex.change : 0;
        drawKpiBlock(
            `Índice Principal: ${mainIndex.name}`,
            formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
            `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
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
            `${change1 >= 0 ? '+' : ''}${change1.toFixed(2)}%`,
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
            `${change2 >= 0 ? '+' : ''}${change2.toFixed(2)}%`,
            change2 >= 0,
            margin + kpiCardWidth + 20, y, kpiCardWidth
        );
    }
    if (kpiAssets.length > 0) {
        y += 100;
    }

    // Resolve report options with sensible defaults
    const opts = {
        includeChart: data.reportOptions?.includeChart !== false,
        includeContext: data.reportOptions?.includeContext !== false,
        includeTable: data.reportOptions?.includeTable !== false,
        chartOnSeparatePage: data.reportOptions?.chartOnSeparatePage === true,
    };

    // --- GRÁFICO DE TENDÊNCIA (se disponível e habilitado) ---
    if (opts.includeChart && data.chartImageDataUrl) {
        if (opts.chartOnSeparatePage) {
            doc.addPage();
            y = 50;
        }
        const imgMargin = margin;
        const imgWidth = pageW - imgMargin * 2;
        const imgHeight = 220; // altura fixa para manter proporção agradável
        if (y + imgHeight + 30 > pageH - 80) {
            doc.addPage();
            y = 50;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.textPrimary);
        doc.text('Gráfico de Tendência', imgMargin, y);
        y += 10;
        try {
            doc.addImage(data.chartImageDataUrl, 'PNG', imgMargin, y, imgWidth, imgHeight, undefined, 'FAST');
            y += imgHeight + 20;
        } catch (e) {
            // Se falhar, apenas segue sem imagem
            y += 10;
        }
    }

    // --- CONTEXTO DA ANÁLISE ---
    if (opts.includeContext && data.analysisMeta) {
        if (y > pageH - 140) {
            doc.addPage();
            y = 50;
        }
        const boxH = 80;
        doc.setFillColor(249, 250, 251); // gray-50
        doc.setDrawColor(COLORS.border);
        doc.roundedRect(margin, y, pageW - margin * 2, boxH, 8, 8, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.textPrimary);
        doc.text('Contexto da Análise', margin + 14, y + 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textSecondary);
        const meta = data.analysisMeta;
        const leftX = margin + 14;
        const midX = margin + (pageW - margin * 2) / 2;
        doc.text(`Período: ${meta.timeRange || 'N/A'}`, leftX, y + 40);
        if (meta.compareMode) doc.text(`Modo do Gráfico: ${meta.compareMode}`, leftX, y + 56);
        const names = meta.assetNames || {};
        const assets = (meta.visibleAssetIds || []).map(a => names[a] || a.toUpperCase()).join(', ');
        const lines = doc.splitTextToSize(`Ativos no Gráfico: ${assets || 'N/A'}`, (pageW - margin * 2) - (leftX - margin));
        doc.text(lines, leftX, y + 72);
        y += boxH + 20;
    }

    // --- TOP 2 ATIVOS (KPIs adicionais) ---
    if (otherAssets && otherAssets.length > 0) {
        const order = data.reportOptions?.kpiOrderBy || 'price_desc';
        const sorted = [...otherAssets].sort((a, b) => {
            if (order === 'change_desc') return (b.change || 0) - (a.change || 0);
            if (order === 'change_asc') return (a.change || 0) - (b.change || 0);
            return (b.price || 0) - (a.price || 0);
        });
        const picks = sorted.slice(0, 2);
        const kpiCardWidth = (pageW - (margin * 2) - 20) / 2;
        const drawKpiBlock = (title: string, value: string, change: string, isPositive: boolean, x: number, yPos: number, width: number) => {
            const color = isPositive ? COLORS.kpi.green : COLORS.kpi.red;
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(x, yPos, width, 70, 8, 8, 'S');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(107, 114, 128);
            doc.text(title, x + 15, yPos + 20);
            doc.setFontSize(18);
            doc.setTextColor(17, 24, 39);
            doc.text(value, x + 15, yPos + 40);
            doc.setFontSize(12);
            doc.setTextColor(color);
            doc.text(change, x + 15, yPos + 58);
        };
        if (y > pageH - 130) { doc.addPage(); y = 50; }
        picks.forEach((asset, idx) => {
            const change = typeof asset.change === 'number' ? asset.change : 0;
            drawKpiBlock(
                asset.name,
                formatCurrency(asset.price, asset.currency || 'BRL', asset.id),
                `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
                change >= 0,
                margin + (idx * (kpiCardWidth + 20)),
                y,
                kpiCardWidth
            );
        });
        y += 90;
    }

    // --- MÉTRICAS DO PERÍODO ---
    if (data.periodMetrics) {
        const m = data.periodMetrics;
        if (y > pageH - 160) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textPrimary);
        doc.text('Métricas do Período', margin, y);
        y += 14;
        const cardW = (pageW - margin * 2 - 40) / 3;
        const drawMetric = (title: string, value: string, x: number, yPos: number) => {
            doc.setDrawColor(COLORS.border);
            doc.roundedRect(x, yPos, cardW, 60, 6, 6, 'S');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(COLORS.textSecondary);
            doc.text(title, x + 12, yPos + 18);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(COLORS.textPrimary);
            doc.text(value, x + 12, yPos + 40);
        };
        drawMetric('Retorno', `${m.returnPct >= 0 ? '+' : ''}${m.returnPct.toFixed(2)}%`, margin, y);
        drawMetric('Volatilidade', `${m.volatilityPct.toFixed(2)}%`, margin + cardW + 20, y);
        drawMetric('Max Drawdown', `${m.maxDrawdownPct.toFixed(2)}%`, margin + (cardW + 20) * 2, y);
        y += 70;
        const drawRange = (title: string, value: string, x: number, yPos: number) => {
            doc.setDrawColor(COLORS.border);
            doc.roundedRect(x, yPos, cardW, 60, 6, 6, 'S');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(COLORS.textSecondary);
            doc.text(title, x + 12, yPos + 18);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(COLORS.textPrimary);
            doc.text(value, x + 12, yPos + 40);
        };
        drawRange('Máximo', formatCurrency(m.high, data.mainIndex?.currency || 'BRL', data.mainIndex?.id), margin, y);
        drawRange('Mínimo', formatCurrency(m.low, data.mainIndex?.currency || 'BRL', data.mainIndex?.id), margin + cardW + 20, y);
        y += 80;
    }

    // --- TABELA DE ATIVOS ---
    if (opts.includeTable && otherAssets.length > 0) {
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

    if (opts.includeTable && historicalTable && historicalTable.rows.length > 0) {
        if (y > pageH - 180) {
            doc.addPage();
            y = 50;
        } else {
            y += 24;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text(historicalTable.title, margin, y);
        y += 16;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(
            `${historicalTable.assetName} • ${historicalTable.mode === 'monthly' ? 'Primeira cotacao disponivel do mes' : 'Cotacoes diarias do periodo selecionado'}`,
            margin,
            y
        );
        y += 14;

        const head = historicalTable.includeOriginalPrice
            ? [['Data', 'Hora', 'Cotacao Original', 'Valor UCS', 'Variacao', 'Variacao Abs.']]
            : [['Data', 'Hora', 'Valor UCS', 'Variacao', 'Variacao Abs.']];

        const body = historicalTable.rows.map((row) => historicalTable.includeOriginalPrice
            ? [row.date, row.time, row.originalPrice || 'N/A', row.price, row.variation, row.absoluteChange]
            : [row.date, row.time, row.price, row.variation, row.absoluteChange]
        );

        const variationColumnIndex = historicalTable.includeOriginalPrice ? 4 : 3;
        const absoluteChangeColumnIndex = historicalTable.includeOriginalPrice ? 5 : 4;

        doc.autoTable({
            startY: y,
            head,
            body,
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, textColor: 255 },
            styles: { cellPadding: 6, fontSize: 9 },
            didParseCell: (tableData: any) => {
                if (tableData.section !== 'body') return;

                if (tableData.column.index === variationColumnIndex || tableData.column.index === absoluteChangeColumnIndex) {
                    const rawValue = String(tableData.cell.raw || '');
                    tableData.cell.styles.textColor = rawValue.startsWith('+') ? COLORS.kpi.green : COLORS.kpi.red;
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
// === TEMPLATE COMERCIAL EXECUTIVO ==================================================
// ===================================================================================
const generateCommercialExecutivePdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate, marketInsights, performanceMetrics, riskAnalysis } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const sectionSpacing = 30;
    const elementSpacing = 20;
    let y = 60;

    // --- CABEÇALHO COMERCIAL ---
    doc.setFillColor(22, 101, 52); // green-800
    doc.roundedRect(0, 0, pageW, 100, 0, 0, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('UCS INDEX', margin, 30);
    doc.setFontSize(20);
    doc.text('Relatório Comercial Executivo', margin, 55);
    doc.setFontSize(12);
    doc.text('Análise Estratégica de Mercado', margin, 75);
    
    // Data no canto superior direito
    doc.setFontSize(10);
    doc.text('Data da Análise:', pageW - margin - 120, 30);
    doc.setFontSize(12);
    doc.text(format(targetDate, "dd/MM/yyyy"), pageW - margin - 120, 50);
    doc.setFontSize(10);
    doc.text(format(targetDate, "HH:mm"), pageW - margin - 120, 65);
    
    y = 120;

    // Sumário (simples)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255,255,255);
    doc.text('Sumário', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(255,255,255);
    ['Resumo Executivo','Métricas de Performance','Análise de Riscos','Insights de Mercado','Performance de Ativos','Recomendações'].forEach((item, i) => {
        doc.text(`• ${item}`, margin, y + i * 14);
    });
    y += 80;

    // --- RESUMO EXECUTIVO ---
    doc.setFillColor(249, 250, 251); // gray-50
    doc.roundedRect(margin, y, pageW - margin * 2, 90, 8, 8, 'F');
    
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('📊 Resumo Executivo', margin + 20, y + 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textSecondary);
    const summaryText = mainIndex 
        ? `O índice principal ${mainIndex.name} apresentou performance ${mainIndex.change && mainIndex.change > 0 ? 'positiva' : 'negativa'} de ${mainIndex.change?.toFixed(2) || '0.00'}% no período analisado. O mercado demonstra ${riskAnalysis?.overallRisk === 'low' ? 'baixo risco' : riskAnalysis?.overallRisk === 'medium' ? 'risco moderado' : 'alto risco'} com tendências ${marketInsights && marketInsights.length > 0 ? 'diversas' : 'estáveis'}.`
        : 'Análise completa do mercado com foco em commodities e ativos correlacionados.';
    
    const splitText = doc.splitTextToSize(summaryText, pageW - margin * 2 - 40);
    doc.text(splitText, margin + 20, y + 45);
    y += 110;

    // --- KPIs PRINCIPAIS ---
    if (performanceMetrics && performanceMetrics.length > 0) {
        // Verificar se há espaço suficiente para a seção
        if (y > pageH - 200) {
            doc.addPage();
            y = 50;
        }
        
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Métricas de Performance', margin, y);
        y += elementSpacing + 5;

        const kpiWidth = (pageW - margin * 2 - 40) / 3;
        const kpiHeight = 70;
        const kpiRows = Math.ceil(performanceMetrics.slice(0, 6).length / 3);
        
        performanceMetrics.slice(0, 6).forEach((metric, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = margin + (kpiWidth + 20) * col;
            const yPos = y + (kpiHeight + 15) * row;
            
            // Verificar se precisa de nova página
            if (yPos + kpiHeight > pageH - 100) {
                doc.addPage();
                y = 50;
                const newYPos = y + (kpiHeight + 15) * row;
                drawCommercialKpiBlock(metric, x, newYPos, kpiWidth, doc);
            } else {
                drawCommercialKpiBlock(metric, x, yPos, kpiWidth, doc);
            }
        });
        
        y += kpiRows * (kpiHeight + 15) + sectionSpacing;
    }

    // --- ANÁLISE DE RISCOS ---
    if (riskAnalysis) {
        if (y > pageH - 250) {
            doc.addPage();
            y = 50;
        }
        
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Análise de Riscos', margin, y);
        y += elementSpacing + 5;

        // Indicador de risco geral
        const riskColor = COLORS.risk[riskAnalysis.overallRisk];
        doc.setFillColor(riskColor);
        doc.circle(margin + 15, y + 12, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(riskAnalysis.overallRisk.toUpperCase().substring(0, 3), margin + 15, y + 12, { align: 'center', baseline: 'middle' });
        
        doc.setTextColor(COLORS.textPrimary);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Risco Geral: ${riskAnalysis.overallRisk.toUpperCase()}`, margin + 40, y + 18);
        y += 35;

        // Fatores de risco
        riskAnalysis.factors.forEach((factor, index) => {
            if (y > pageH - 120) {
                doc.addPage();
                y = 50;
            }
            
            const factorColor = COLORS.risk[factor.level];
            doc.setFillColor(factorColor);
            doc.roundedRect(margin, y, pageW - margin * 2, 35, 4, 4, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(factor.name, margin + 10, y + 15);
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const descText = doc.splitTextToSize(factor.description, pageW - margin * 2 - 20);
            doc.text(descText, margin + 10, y + 25);
            
            y += 45;
        });
        y += sectionSpacing;
    }

    // --- INSIGHTS DE MERCADO ---
    if (marketInsights && marketInsights.length > 0) {
        if (y > pageH - 200) {
            doc.addPage();
            y = 50;
        }
        
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Insights de Mercado', margin, y);
        y += elementSpacing + 5;

        marketInsights.forEach((insight, index) => {
            if (y > pageH - 100) {
                doc.addPage();
                y = 50;
            }
            
            drawMarketInsightBlock(insight, margin, y, pageW - margin * 2, doc);
            y += 85;
        });
        y += sectionSpacing;
    }

    // --- PERFORMANCE DE ATIVOS ---
    if (y > pageH - 150) {
        doc.addPage();
        y = 50;
    }
    
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Performance Detalhada dos Ativos', margin, y);
    y += elementSpacing + 5;

    const allAssets = [...(mainIndex ? [mainIndex] : []), ...secondaryIndices, ...currencies, ...otherAssets];
    if (allAssets.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Categoria', 'Valor', 'Variação', 'Status']],
            body: allAssets.map(asset => {
                const changeValue = typeof asset.change === 'number' ? asset.change : 0;
                const status = changeValue > 0 ? 'Alta' : changeValue < 0 ? 'Baixa' : 'Estavel';
                return [
                    asset.name,
                    asset.category,
                    formatCurrency(asset.price, asset.currency, asset.id),
                    `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
                    status
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, textColor: 255 },
            styles: { cellPadding: 5, fontSize: 8 },
            margin: { left: margin, right: margin },
            didParseCell: (data: any) => {
                if (data.column.index === 3 && data.section === 'body') {
                    const rawValue = data.cell.raw as string;
                    data.cell.styles.textColor = rawValue.startsWith('+') ? COLORS.kpi.green : COLORS.kpi.red;
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY + sectionSpacing;
    }

    // --- RECOMENDAÇÕES ESTRATÉGICAS ---
    if (y > pageH - 150) {
        doc.addPage();
        y = 50;
    }
    
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Recomendações Estratégicas', margin, y);
    y += elementSpacing + 5;

    const recommendations = generateRecommendations(data);
    recommendations.forEach((rec, index) => {
        if (y > pageH - 120) {
            doc.addPage();
            y = 50;
        }
        
        doc.setFillColor(rec.color);
        doc.roundedRect(margin, y, pageW - margin * 2, 50, 6, 6, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(rec.title, margin + 15, y + 18);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const recText = doc.splitTextToSize(rec.description, pageW - margin * 2 - 30);
        doc.text(recText, margin + 15, y + 32);
        
        y += 60;
    });

    // --- RODAPÉ COMERCIAL ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setFillColor(22, 101, 52); // green-800
        doc.roundedRect(0, pageH - 60, pageW, 60, 0, 0, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Confidencial - UCS Index | Relatório Comercial Executivo', margin, pageH - 35);
        doc.text('Uso Interno - Não distribuir sem autorização', margin, pageH - 20);
        doc.text(`Página ${i} de ${doc.internal.pages.length}`, pageW - margin, pageH - 35, { align: 'right' });
    }

    return doc;
};

// Funções auxiliares para o relatório comercial
const drawCommercialKpiBlock = (metric: PerformanceMetric, x: number, y: number, width: number, doc: jsPDF) => {
    const trendIcon = metric.trend === 'up' ? '' : metric.trend === 'down' ? '' : '';
    const trendColor = metric.trend === 'up' ? COLORS.kpi.green : metric.trend === 'down' ? COLORS.kpi.red : COLORS.textSecondary;
    
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, 70, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textSecondary);
    const nameLines = doc.splitTextToSize(metric.name, width - 20);
    doc.text(nameLines, x + 10, y + 12);

    doc.setFontSize(16);
    doc.setTextColor(COLORS.textPrimary);
    const valueText = `${metric.value.toFixed(2)} ${metric.unit}`;
    doc.text(valueText, x + 10, y + 30);

    doc.setFontSize(10);
    doc.setTextColor(trendColor);
    doc.text(`${metric.period}`, x + 10, y + 50);
};

const drawMarketInsightBlock = (insight: MarketInsight, x: number, y: number, width: number, doc: jsPDF) => {
    const impactColor = COLORS.insight[insight.impact];
    
    doc.setFillColor(impactColor);
    doc.roundedRect(x, y, width, 75, 6, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(`${insight.title}`, width - 30);
    doc.text(titleLines, x + 15, y + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descText = doc.splitTextToSize(insight.description, width - 30);
    doc.text(descText, x + 15, y + 35);
    
    // Indicador de confiança
    doc.setFontSize(8);
    doc.text(`Confiança: ${insight.confidence}%`, x + width - 80, y + 65);
};

const generateRecommendations = (data: DashboardPdfData) => {
    const recommendations = [];
    
    if (data.mainIndex && data.mainIndex.change && data.mainIndex.change > 0) {
        recommendations.push({
            title: 'Oportunidade de Investimento',
            description: 'O índice principal apresenta tendência positiva, sugerindo oportunidades de alocação de capital.',
            color: COLORS.kpi.green
        });
    }
    
    if (data.riskAnalysis && data.riskAnalysis.overallRisk === 'high') {
        recommendations.push({
            title: 'Gestão de Risco',
            description: 'Alto nível de risco detectado. Recomenda-se diversificação de portfólio e monitoramento contínuo.',
            color: COLORS.kpi.red
        });
    }
    
    if (data.marketInsights && data.marketInsights.length > 0) {
        recommendations.push({
            title: 'Análise de Mercado',
            description: 'Insights específicos do mercado identificados. Considere ajustes estratégicos baseados nas tendências.',
            color: COLORS.kpi.blue
        });
    }
    
    return recommendations;
};

// ===================================================================================
// === TEMPLATE DE COMPOSIÇÃO ========================================================
// ===================================================================================
const generateCompositionPdf = (data: DashboardPdfData): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
  const { mainIndex, otherAssets: components, targetDate } = data;
  
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 50;
  let y = 60;

  // --- CABEÇALHO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.kpi.blue);
  doc.text('ANÁLISE DE COMPOSIÇÃO', margin, y);

  // Logo no lado direito (externa se definida, senão BMV)
  drawLogo(doc, data, pageW - margin - 50, y - 10, 50, 25);
  
  y += 40;

  doc.setFontSize(28);
  doc.setTextColor(COLORS.textPrimary);
  doc.text(mainIndex?.name || 'Índice de Composição', margin, y);
  y += 28;
  doc.setFontSize(14);
  doc.setTextColor(COLORS.textSecondary);
  doc.text(`Dados de ${format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
  y += 60;

  // --- KPIS CIRCULARES ---
  const allComponents = components || [];
  
  // Criar componentes baseados nos dados da coleção valor_uso_solo
  // Se mainIndex contém dados de componentes, usar esses dados
  let carbonoCrs: CommodityPriceData | undefined;
  let aguaCrs: CommodityPriceData | undefined;
  let crsTotalItem: CommodityPriceData | undefined;
  
  // Verificar se mainIndex tem dados de componentes (estrutura da coleção valor_uso_solo)
  if (mainIndex && (mainIndex as any).componentes) {
    const componentes = (mainIndex as any).componentes;
    const porcentagens = (mainIndex as any).porcentagens;
    
    
    // Criar componente Carbono CRS
    if (componentes.carbono_crs !== undefined) {
      carbonoCrs = {
        id: 'carbono_crs',
        name: 'Carbono CRS',
        price: componentes.carbono_crs,
        currency: 'BRL',
        change: porcentagens?.carbono_crs || 0,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Custo de Responsabilidade Socioambiental - Carbono',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
    
    // Criar componente Agua CRS - usar o campo correto do Firebase: agua_crs (minúsculo)
    const aguaCrsValue = componentes.agua_crs; // Campo correto do Firebase
    const aguaCrsPercent = mainIndex?.price ? (aguaCrsValue / mainIndex.price) * 100 : 0; // Calcular porcentagem como no composition-analysis
    
    if (aguaCrsValue !== undefined) {
      aguaCrs = {
        id: 'Agua_CRS',
        name: 'Água CRS',
        price: aguaCrsValue,
        currency: 'BRL',
        change: aguaCrsPercent || 0,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Custo de Responsabilidade Socioambiental - Água',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
    
    // Criar componente CRS Total - usar a mesma lógica do composition-analysis.tsx
    if (carbonoCrs || aguaCrs) {
      const crsTotalPrice = (carbonoCrs?.price || 0) + (aguaCrs?.price || 0);
      const crsTotalChange = mainIndex?.price ? (crsTotalPrice / mainIndex.price) * 100 : 0; // Calcular porcentagem como no composition-analysis
      
      crsTotalItem = {
        id: 'crs_total',
        name: 'CRS (Custo de Resp. Socioambiental)',
        price: crsTotalPrice,
        currency: 'BRL',
        change: crsTotalChange,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Custo de Responsabilidade Socioambiental Total',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
  } else {
    // Fallback para a lógica anterior se não houver dados de componentes
    carbonoCrs = allComponents.find(c => c.id === 'carbono_crs');
    aguaCrs = allComponents.find(c => c.id === 'Agua_CRS');
    
    crsTotalItem = allComponents.find(c => c.id === 'crs_total');
    if (!crsTotalItem && (carbonoCrs || aguaCrs)) {
      const crsTotalPrice = (carbonoCrs?.price || 0) + (aguaCrs?.price || 0);
      const crsTotalChange = mainIndex ? (crsTotalPrice / mainIndex.price) * 100 : 0;
      
      crsTotalItem = {
        id: 'crs_total',
        name: 'CRS (Custo de Resp. Socioambiental)',
        price: crsTotalPrice,
        currency: 'BRL',
        change: crsTotalChange,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Custo de Responsabilidade Socioambiental Total',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
  }
  
  const mainItems = [
    allComponents.find(c => c.id === 'vus'),
    allComponents.find(c => c.id === 'vmad'),
    crsTotalItem,
  ].filter(Boolean) as CommodityPriceData[];

  const kpiCount = mainItems.length;
  if (kpiCount > 0) {
      const cardWidth = (pageW - margin * 2) / kpiCount;
      const circleRadius = 50;
      
      mainItems.forEach((item, index) => {
          const x = margin + (cardWidth * index) + (cardWidth / 2);
          const itemColor = COLORS.chart[`c${index + 1}` as keyof typeof COLORS.chart] || COLORS.chart.c1;
          const percentage = item.change || 0;

          // Círculo
          doc.setLineWidth(8);
          doc.setDrawColor(itemColor);
          doc.circle(x, y + circleRadius, circleRadius, 'S');
          
          // Texto da Porcentagem
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.setTextColor(itemColor);
          doc.text(`${percentage.toFixed(2)}%`, x, y + circleRadius + 8, { align: 'center' });
      });

      y += (circleRadius * 2) + 20;

      // Legendas dos Círculos
      mainItems.forEach((item, index) => {
          const x = margin + (cardWidth * index) + (cardWidth / 2);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(COLORS.textPrimary);
          doc.text(item.name, x, y, { align: 'center' });
      });

      y += 40;
  }
  
  // --- TABELA RESUMO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.textPrimary);
  doc.text('Resumo da Composição', margin, y);
  y += 25;

  const tableBody = [];
  
  // Usar os componentes criados dinamicamente ou buscar nos dados existentes
  let vus = allComponents.find(c => c.id === 'vus');
  let vmad = allComponents.find(c => c.id === 'vmad');
  
  // Se mainIndex tem dados de componentes, criar VUS e VMAD também
  if (mainIndex && (mainIndex as any).componentes) {
    const componentes = (mainIndex as any).componentes;
    const porcentagens = (mainIndex as any).porcentagens;
    
    if (componentes.vus !== undefined) {
      vus = {
        id: 'vus',
        name: 'VUS (Valor de Uso do Solo)',
        price: componentes.vus,
        currency: 'BRL',
        change: porcentagens?.vus || 0,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Valor de Uso do Solo',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
    
    if (componentes.vmad !== undefined) {
      vmad = {
        id: 'vmad',
        name: 'VMAD (Valor da Madeira)',
        price: componentes.vmad,
        currency: 'BRL',
        change: porcentagens?.vmad || 0,
        absoluteChange: 0,
        category: 'sub-index',
        description: 'Valor da Madeira',
        unit: 'BRL',
        lastUpdated: targetDate.toISOString()
      };
    }
  }
  
  if (vus) tableBody.push([vus.name, formatCurrency(vus.price, 'BRL'), `${(vus.change || 0).toFixed(2)}%`]);
  if (vmad) tableBody.push([vmad.name, formatCurrency(vmad.price, 'BRL'), `${(vmad.change || 0).toFixed(2)}%`]);

  if (crsTotalItem) {
    tableBody.push([crsTotalItem.name, formatCurrency(crsTotalItem.price, 'BRL'), `${(crsTotalItem.change || 0).toFixed(2)}%`]);
    
    // Usar os componentes criados dinamicamente
    if (carbonoCrs) {
      tableBody.push([`  - ${carbonoCrs.name}`, formatCurrency(carbonoCrs.price, 'BRL'), `${(carbonoCrs.change || 0).toFixed(2)}%`]);
    }
    if (aguaCrs) {
      tableBody.push([`  - ${aguaCrs.name}`, formatCurrency(aguaCrs.price, 'BRL'), `${(aguaCrs.change || 0).toFixed(2)}%`]);
    }
  }
  
  doc.autoTable({
      startY: y,
      head: [['Componente', 'Valor', 'Participação (%)']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.textPrimary, textColor: 255 },
      styles: { cellPadding: 8, fontSize: 10, halign: 'left' },
      columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
      },
      didParseCell: (data: any) => {
          if (data.row.raw[0].toString().includes('- ')) {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.textColor = COLORS.textSecondary;
          }
           if (data.row.raw[0].toString().includes('CRS (Custo')) {
              data.cell.styles.fontStyle = 'bold';
          }
      },
  });
  y = (doc as any).lastAutoTable.finalY + 40;

  // --- VALOR TOTAL ---
  if(mainIndex) {
      doc.setFillColor(COLORS.kpi.blue);
      doc.roundedRect(margin, y, pageW - margin * 2, 50, 8, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('Valor Total do Índice', margin + 20, y + 30);
      
      doc.setFontSize(22);
      doc.text(formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id), pageW - margin - 20, y + 30, { align: 'right' });
  }

  // --- RODAPÉ ---
  for (let i = 1; i <= doc.internal.pages.length; i++) {
      doc.setPage(i);
      doc.setDrawColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
      doc.setFontSize(9);
      doc.setTextColor(COLORS.textSecondary);
      doc.text(`Confidencial | UCS Index`, margin, pageH - 25);
      doc.text(`Página ${i}`, pageW - margin, pageH - 25, { align: 'right' });
  }
  
  return doc;
};


// ===================================================================================
// === TEMPLATE PERSONALIZADO =======================================================
// ===================================================================================
const generateCustomPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { targetDate, customSections } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const sectionSpacing = 25;
    const elementSpacing = 15;
    let y = 60;

    // --- CABEÇALHO PERSONALIZADO ---
    doc.setFillColor(COLORS.primary);
    doc.roundedRect(0, 0, pageW, 90, 0, 0, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('UCS INDEX', margin, 30);
    doc.setFontSize(14);
    doc.text('Relatório Personalizado', margin, 50);
    doc.setFontSize(10);
    doc.text(`Gerado em ${format(targetDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 70);
    // Logo (externa se definida, senão BMV)
    drawLogo(doc, data, pageW - margin - 50, 25, 50, 25);
    
    y = 110;
    
    // --- SEÇÕES PERSONALIZADAS ---
    if (customSections && customSections.length > 0) {
        customSections.forEach((section, index) => {
            if (y > pageH - 150) {
                doc.addPage();
                y = 50;
            }
            
            // Título da seção
            doc.setTextColor(COLORS.textPrimary);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(section.title, margin, y);
            y += elementSpacing + 5;
            
            // Conteúdo da seção baseado no tipo
            switch (section.type) {
                case 'text': {
                    doc.setTextColor(COLORS.textSecondary);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    const textLines = doc.splitTextToSize(section.content, pageW - margin * 2);
                    doc.text(textLines, margin, y);
                    y += textLines.length * 12 + sectionSpacing;
                    break;
                }
                case 'kpi': {
                    if (section.data && section.data.length > 0) {
                        const kpiWidth = (pageW - margin * 2 - 40) / Math.min(section.data.length, 3);
                        const kpiHeight = 60;
                        const kpiRows = Math.ceil(section.data.length / 3);
                        section.data.forEach((kpi: any, kpiIndex: number) => {
                            const col = kpiIndex % 3;
                            const row = Math.floor(kpiIndex / 3);
                            const x = margin + (kpiWidth + 20) * col;
                            const yPos = y + (kpiHeight + 15) * row;
                            if (yPos + kpiHeight > pageH - 100) {
                                doc.addPage();
                                y = 50;
                                const newYPos = y + (kpiHeight + 15) * row;
                                drawCustomKpiBlock(kpi, x, newYPos, kpiWidth, doc);
                            } else {
                                drawCustomKpiBlock(kpi, x, yPos, kpiWidth, doc);
                            }
                        });
                        y += kpiRows * (kpiHeight + 15) + sectionSpacing;
                    }
                    break;
                }
                case 'table': {
                    if (section.data && section.data.length > 0) {
                        doc.autoTable({
                            startY: y,
                            head: section.data[0] ? Object.keys(section.data[0]).map(key => key.toUpperCase()) : [],
                            body: section.data.map((row: any) => Object.values(row)),
                            theme: 'striped',
                            headStyles: { fillColor: COLORS.primary, textColor: 255 },
                            styles: { cellPadding: 5, fontSize: 8 },
                            margin: { left: margin, right: margin },
                        });
                        y = (doc as any).lastAutoTable.finalY + sectionSpacing;
                    }
                    break;
                }
                case 'chart': {
                    doc.setFillColor(249, 250, 251);
                    doc.roundedRect(margin, y, pageW - margin * 2, 80, 8, 8, 'F');
                    doc.setTextColor(COLORS.textSecondary);
                    doc.setFontSize(9);
                    doc.text('Grafico: ' + section.content, margin + 20, y + 40);
                    y += 100;
                    break;
                }
            }
            
            // Separador entre seções
            if (index < customSections.length - 1) {
                doc.setDrawColor(COLORS.border);
                doc.setLineWidth(0.5);
                doc.line(margin, y - 10, pageW - margin, y - 10);
                y += sectionSpacing;
            }
        });
    } else {
        // Seção padrão quando não há seções personalizadas
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Relatório Personalizado', margin, y);
        y += elementSpacing + 5;
        
        doc.setTextColor(COLORS.textSecondary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Este é um relatório personalizado gerado pelo UCS Index. Use as configurações de personalização para adicionar seções específicas.', margin, y);
    }

    // --- RODAPÉ PERSONALIZADO ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setFillColor(COLORS.primary);
        doc.roundedRect(0, pageH - 40, pageW, 40, 0, 0, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('UCS Index - Relatório Personalizado', margin, pageH - 20);
        doc.text('Uso Interno - Documento Confidencial', margin, pageH - 8);
        doc.text(`Página ${i}`, pageW - margin, pageH - 20, { align: 'right' });
    }

    return doc;
};

const drawCustomKpiBlock = (kpi: any, x: number, y: number, width: number, doc: jsPDF) => {
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, 60, 6, 6, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textSecondary);
    const titleLines = doc.splitTextToSize(kpi.title || 'KPI', width - 20);
    doc.text(titleLines, x + 10, y + 12);

    doc.setFontSize(14);
    doc.setTextColor(COLORS.textPrimary);
    const valueText = `${kpi.value || '0'} ${kpi.unit || ''}`;
    doc.text(valueText, x + 10, y + 30);

    doc.setFontSize(8);
    doc.setTextColor(COLORS.textSecondary);
    if (kpi.trend) {
        const trendIcon = kpi.trend === 'up' ? '📈' : kpi.trend === 'down' ? '📉' : '➡️';
        doc.text(trendIcon, x + 10, y + 45);
    }
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
        
        const changeValue = data.mainIndex?.change;

        if (changeValue === undefined || changeValue === null || typeof changeValue !== 'number') {
            if(data.mainIndex) {
               data.mainIndex.change = 0;
            }
        }
        
        let doc: jsPDF;
        
        switch (reportType.toLowerCase()) {
            case 'report':
            case 'ia_analysis':
                doc = generateAiAnalysisPdf(data);
                break;
            case 'composition':
            case 'análise de composição':
                doc = generateCompositionPdf(data);
                break;
            case 'commercial':
            case 'comercial executivo':
            case 'commercial-executive':
                doc = generateCommercialExecutivePdf(data);
                break;
            case 'custom':
            case 'personalizado':
            case 'personalized':
                doc = generateCustomPdf(data);
                break;
            case 'executive':
            case 'executivo':
            case 'asset-detail':
            case 'dashboard':
            case 'audit':
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
