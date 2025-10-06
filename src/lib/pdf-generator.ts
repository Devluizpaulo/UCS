

'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData } from './types';
import { formatCurrency } from './formatters';
import type { ReportOutput } from '@/ai/flows/report-flow';


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
    // Dados para o relatório de IA
    aiReportData?: ReportOutput;
    // Dados adicionais para relatórios comerciais
    marketInsights?: MarketInsight[];
    performanceMetrics?: PerformanceMetric[];
    riskAnalysis?: RiskAnalysis;
    customSections?: CustomSection[];
}

export interface MarketInsight {
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number; // 0-100
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    period: string;
}

export interface RiskAnalysis {
    overallRisk: 'low' | 'medium' | 'high';
    factors: {
        name: string;
        level: 'low' | 'medium' | 'high';
        description: string;
    }[];
}

export interface CustomSection {
    title: string;
    content: string;
    type: 'text' | 'table' | 'chart' | 'kpi';
    data?: any[];
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
    blue: '#3b82f6', // blue-500
    yellow: '#f59e0b', // amber-500
  },
  chart: {
    c1: '#3b82f6', // blue-500
    c2: '#f97316', // orange-500
    c3: '#8b5cf6', // violet-500
    c4: '#10b981', // emerald-500
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

// ===================================================================================
// === TEMPLATE DE ANÁLISE GERADA PELA IA ============================================
// ===================================================================================
const generateAiAnalysisPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, targetDate, aiReportData } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
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

    if (!aiReportData) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.textSecondary);
        doc.text('Dados da análise de IA não encontrados.', margin, y);
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
    drawSection('Análise de Tendência', aiReportData.trendAnalysis);
    drawSection('Análise de Volatilidade', aiReportData.volatilityAnalysis);
    drawSection('Conclusão', aiReportData.conclusion);
    
    // --- RODAPÉ ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, doc.internal.pageSize.getHeight() - 40, pageW - margin, doc.internal.pageSize.getHeight() - 40);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Confidencial | UCS Index - Relatório de IA`, margin, doc.internal.pageSize.getHeight() - 25);
        doc.text(`Página ${i}`, pageW - margin, doc.internal.pageSize.getHeight() - 25, { align: 'right' });
    }

    return doc;
};


// ===================================================================================
// === TEMPLATE EXECUTIVO ============================================================
// ===================================================================================
const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
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
        doc.text('📈 Métricas de Performance', margin, y);
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
        doc.text('⚠️ Análise de Riscos', margin, y);
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
        doc.text('💡 Insights de Mercado', margin, y);
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
    doc.text('📊 Performance Detalhada dos Ativos', margin, y);
    y += elementSpacing + 5;

    const allAssets = [...(mainIndex ? [mainIndex] : []), ...secondaryIndices, ...currencies, ...otherAssets];
    if (allAssets.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Categoria', 'Valor', 'Variação', 'Status']],
            body: allAssets.map(asset => {
                const changeValue = typeof asset.change === 'number' ? asset.change : 0;
                const status = changeValue > 0 ? '📈 Alta' : changeValue < 0 ? '📉 Baixa' : '➡️ Estável';
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
    doc.text('🎯 Recomendações Estratégicas', margin, y);
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
        doc.text(`Página ${i} de ${doc.internal.pages.length}`, pageW - margin, pageH - 35, { align: 'right' });
    }

    return doc;
};

// Funções auxiliares para o relatório comercial
const drawCommercialKpiBlock = (metric: PerformanceMetric, x: number, y: number, width: number, doc: jsPDF) => {
    const trendIcon = metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️';
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
    doc.text(`${trendIcon} ${metric.period}`, x + 10, y + 50);
};

const drawMarketInsightBlock = (insight: MarketInsight, x: number, y: number, width: number, doc: jsPDF) => {
    const impactColor = COLORS.insight[insight.impact];
    const impactIcon = insight.impact === 'positive' ? '✅' : insight.impact === 'negative' ? '⚠️' : 'ℹ️';
    
    doc.setFillColor(impactColor);
    doc.roundedRect(x, y, width, 75, 6, 6, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(`${impactIcon} ${insight.title}`, width - 30);
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
                case 'text':
                    doc.setTextColor(COLORS.textSecondary);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    const textLines = doc.splitTextToSize(section.content, pageW - margin * 2);
                    doc.text(textLines, margin, y);
                    y += textLines.length * 12 + sectionSpacing;
                    break;
                    
                case 'kpi':
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
                    
                case 'table':
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
                    
                case 'chart':
                    // Para gráficos, vamos criar uma representação textual
                    doc.setFillColor(249, 250, 251);
                    doc.roundedRect(margin, y, pageW - margin * 2, 80, 8, 8, 'F');
                    doc.setTextColor(COLORS.textSecondary);
                    doc.setFontSize(9);
                    doc.text('📊 Gráfico: ' + section.content, margin + 20, y + 40);
                    y += 100;
                    break;
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
    const drawCompositionKpiBlock = (title: string, value: string, percentage: string, x: number, yPos: number, width: number) => {
        doc.setDrawColor(COLORS.border);
        doc.roundedRect(x, yPos, width, 70, 8, 8, 'S');
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(title, x + 15, yPos + 20);
    
        doc.setFontSize(20);
        doc.setTextColor(COLORS.textPrimary);
        doc.text(value, x + 15, yPos + 45);
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.primary);
        doc.text(percentage, x + width - 15, yPos + 45, { align: 'right' });
    };
    
    const allComponents = components || [];
    const kpiCount = allComponents.length;
    const kpiCardWidth = (pageW - (margin * 2) - ((kpiCount - 1) * 15)) / kpiCount;

    if (allComponents.length > 0) {
        allComponents.forEach((component, index) => {
            drawCompositionKpiBlock(
                component.name,
                formatCurrency(component.price, component.currency, component.id),
                `${(component.change || 0).toFixed(2)}%`,
                margin + (kpiCardWidth + 15) * index,
                y,
                kpiCardWidth
            );
        });
        y += 90;
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

    if (allComponents.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Componente', 'Valor', 'Participação (%)']],
            body: allComponents.map(c => [c.name, formatCurrency(c.price, c.currency, c.id), `${(c.change || 0).toFixed(2)}%`]),
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
