

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
    // Dados expandidos do banco de dados
    historicalData?: HistoricalData[];
    marketSummary?: MarketSummary;
    volatilityMetrics?: VolatilityMetrics;
    correlationAnalysis?: CorrelationAnalysis;
    auditTrail?: AuditTrailEntry[];
    calculationDetails?: CalculationDetails;
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

// Novas interfaces para dados expandidos do banco
export interface HistoricalData {
    assetId: string;
    assetName: string;
    date: string;
    price: number;
    change: number;
    volume?: number;
    source: string;
}

export interface MarketSummary {
    totalAssets: number;
    totalValue: number;
    averageChange: number;
    positiveAssets: number;
    negativeAssets: number;
    stableAssets: number;
    topPerformer: {
        name: string;
        change: number;
    };
    worstPerformer: {
        name: string;
        change: number;
    };
    marketTrend: 'bullish' | 'bearish' | 'neutral';
}

export interface VolatilityMetrics {
    overallVolatility: number;
    highVolatilityAssets: Array<{
        name: string;
        volatility: number;
    }>;
    lowVolatilityAssets: Array<{
        name: string;
        volatility: number;
    }>;
    volatilityTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface CorrelationAnalysis {
    strongCorrelations: Array<{
        asset1: string;
        asset2: string;
        correlation: number;
    }>;
    weakCorrelations: Array<{
        asset1: string;
        asset2: string;
        correlation: number;
    }>;
    diversificationScore: number;
}

export interface AuditTrailEntry {
    timestamp: string;
    action: string;
    assetName: string;
    oldValue: number;
    newValue: number;
    user: string;
    impact: 'low' | 'medium' | 'high';
}

export interface CalculationDetails {
    calculationTime: string;
    dependencies: Array<{
        asset: string;
        formula: string;
        dependencies: string[];
    }>;
    errors: Array<{
        asset: string;
        error: string;
        severity: 'warning' | 'error';
    }>;
    performanceMetrics: {
        calculationTime: number;
        memoryUsage: number;
        accuracy: number;
    };
}

const COLORS = {
    // Paleta principal moderna e profissional
    primary: '#1e40af', // blue-800 - azul corporativo
    primaryLight: '#3b82f6', // blue-500
    primaryDark: '#1e3a8a', // blue-900
    secondary: '#059669', // emerald-600 - verde para acentos
    secondaryLight: '#10b981', // emerald-500
    secondaryDark: '#047857', // emerald-700

    // Textos e hierarquia
    textPrimary: '#111827', // gray-900 - preto suave
    textSecondary: '#374151', // gray-700
    textTertiary: '#6b7280', // gray-500
    textLight: '#9ca3af', // gray-400

    // Backgrounds e superfícies
    background: '#ffffff', // branco puro
    backgroundSecondary: '#f9fafb', // gray-50
    backgroundTertiary: '#f3f4f6', // gray-100
    surface: '#ffffff',
    surfaceElevated: '#fafafa',
  white: '#ffffff',

    // Bordas e divisores
    border: '#e5e7eb', // gray-200
    borderLight: '#f3f4f6', // gray-100
    borderDark: '#d1d5db', // gray-300

    // Cores de status
    success: '#10b981', // emerald-500
    successLight: '#d1fae5', // emerald-100
    warning: '#f59e0b', // amber-500
    warningLight: '#fef3c7', // amber-100
    error: '#ef4444', // red-500
    errorLight: '#fee2e2', // red-100
    info: '#3b82f6', // blue-500
    infoLight: '#dbeafe', // blue-100

    // Gradientes modernos
    gradients: {
        primary: ['#1e40af', '#3b82f6'],
        secondary: ['#059669', '#10b981'],
        neutral: ['#6b7280', '#9ca3af'],
        success: ['#10b981', '#34d399'],
        warning: ['#f59e0b', '#fbbf24'],
        error: ['#ef4444', '#f87171']
    },

    // Cores específicas para KPIs
  kpi: {
        positive: '#10b981', // emerald-500
        negative: '#ef4444', // red-500
        neutral: '#6b7280', // gray-500
        primary: '#1e40af', // blue-800
        secondary: '#059669', // emerald-600
        warning: '#f59e0b', // amber-500
        info: '#3b82f6', // blue-500
        // Compatibilidade com código existente
        green: '#10b981',
        red: '#ef4444',
        yellow: '#f59e0b',
        blue: '#3b82f6'
    },

    // Cores para gráficos
  chart: {
        c1: '#1e40af', // blue-800
        c2: '#059669', // emerald-600
        c3: '#f59e0b', // amber-500
        c4: '#ef4444', // red-500
        c5: '#8b5cf6', // violet-500
        c6: '#06b6d4', // cyan-500
    },

    // Cores de risco
    risk: {
        low: '#10b981', // emerald-500
        medium: '#f59e0b', // amber-500
        high: '#ef4444', // red-500
    },

    // Cores de insights
    insight: {
        positive: '#10b981', // emerald-500
        negative: '#ef4444', // red-500
        neutral: '#6b7280', // gray-500
    }
};

// ===================================================================================
// === FUNÇÕES AUXILIARES DE DESIGN ==================================================
// ===================================================================================

// Função para criar gradientes simples (simulado com múltiplas linhas)
const drawGradientBackground = (doc: jsPDF, x: number, y: number, width: number, height: number, colors: string[]) => {
    try {
        const steps = 20;
        const stepHeight = height / steps;

        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const r1 = parseInt(colors[0].substring(1, 3), 16);
            const g1 = parseInt(colors[0].substring(3, 5), 16);
            const b1 = parseInt(colors[0].substring(5, 7), 16);
            const r2 = parseInt(colors[1].substring(1, 3), 16);
            const g2 = parseInt(colors[1].substring(3, 5), 16);
            const b2 = parseInt(colors[1].substring(5, 7), 16);

            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);

            doc.setFillColor(r, g, b);
            doc.rect(x, y + i * stepHeight, width, stepHeight, 'F');
        }
    } catch (error) {
        // Fallback para cor sólida em caso de erro
        console.warn('Erro ao criar gradiente, usando cor sólida:', error);
        doc.setFillColor(parseInt(colors[0].substring(1, 3), 16), parseInt(colors[0].substring(3, 5), 16), parseInt(colors[0].substring(5, 7), 16));
        doc.rect(x, y, width, height, 'F');
    }
};

// Função para criar sombra sutil
const drawShadow = (doc: jsPDF, x: number, y: number, width: number, height: number, offset: number = 2) => {
    doc.setFillColor(0, 0, 0, 0.1);
    doc.roundedRect(x + offset, y + offset, width, height, 8, 8, 'F');
};

// Função para criar ícones mais sofisticados usando texto (ASCII seguro)
const getIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
        'trend-up': '▲',
        'trend-down': '▼',
        'trend-stable': '●',
        'chart': '■',
        'analysis': '◆',
        'warning': '⚠',
        'success': '✓',
        'info': 'i',
        'risk': '!',
        'performance': '▲',
        'market': '◉',
        'recommendation': '●',
        'summary': '▣',
        'insight': '●',
        'kpi': '■',
        'composition': '◐',
        'executive': '◉',
        'commercial': '◉',
        'custom': '◊',
        'ai': '◉'
    };
    return icons[type] || '●';
};

// Função para criar separadores visuais elegantes
const drawSeparator = (doc: jsPDF, x: number, y: number, width: number, style: 'line' | 'dots' | 'gradient' = 'line') => {
    switch (style) {
        case 'dots':
            doc.setFillColor(COLORS.border);
            for (let i = 0; i < width; i += 8) {
                doc.circle(x + i, y, 1, 'F');
            }
            break;
        case 'gradient':
            drawGradientBackground(doc, x, y - 1, width, 2, [COLORS.primary, COLORS.primaryLight]);
            break;
        default:
            doc.setDrawColor(COLORS.border);
            doc.setLineWidth(0.5);
            doc.line(x, y, x + width, y);
    }
};

// Função para criar badges/cards com melhor design
const drawModernCard = (doc: jsPDF, x: number, y: number, width: number, height: number, title: string, content: string, color: string = COLORS.primary) => {
    // Sombra
    drawShadow(doc, x, y, width, height, 3);

    // Card principal
    doc.setFillColor(COLORS.background);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, height, 12, 12, 'FD');

    // Header com cor
    doc.setFillColor(color);
    doc.roundedRect(x, y, width, 25, 12, 12, 'F');

    // Título
    doc.setTextColor(COLORS.background);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, x + 15, y + 16);

    // Conteúdo
    doc.setTextColor(COLORS.textSecondary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const contentLines = doc.splitTextToSize(content, width - 30);
    doc.text(contentLines, x + 15, y + 35);
};

// Função para criar gráfico de barras simples
const drawSimpleBarChart = (doc: jsPDF, x: number, y: number, width: number, height: number, data: Array<{ label: string, value: number, color?: string }>) => {
    if (!data || data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width - 40) / data.length;
    const chartHeight = height - 40;

    // Background do gráfico
    doc.setFillColor(COLORS.background);
    doc.roundedRect(x, y, width, height, 8, 8, 'F');
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, height, 8, 8, 'S');

    // Título do gráfico
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Performance Comparativa', x + 15, y + 20);

    // Desenhar barras
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const barX = x + 20 + index * barWidth;
        const barY = y + height - 20 - barHeight;

        // Cor da barra
        const corBarra = item.color || COLORS.chart[`c${(index % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6}`];
        doc.setFillColor(corBarra);
        doc.roundedRect(barX, barY, barWidth - 5, barHeight, 3, 3, 'F');

        // Valor da barra
        doc.setTextColor(COLORS.textPrimary);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value.toFixed(1), barX + (barWidth - 5) / 2, barY - 5, { align: 'center' });

        // Label
        doc.setFontSize(7);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(item.label, barX + (barWidth - 5) / 2, y + height - 8, { align: 'center' });
    });
};

// Função para criar indicador de progresso circular
const drawProgressCircle = (doc: jsPDF, x: number, y: number, radius: number, progress: number, color: string = COLORS.primary, label?: string) => {
    const centerX = x + radius;
    const centerY = y + radius;

    // Círculo de fundo
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(3);
    doc.circle(centerX, centerY, radius, 'S');

    // Arco de progresso
    const angle = (progress / 100) * 360;
    doc.setDrawColor(color);
    doc.setLineWidth(4);
    doc.setLineCap('round');

    // Desenhar arco (simulado com múltiplas linhas)
    const steps = Math.floor(angle / 5);
    for (let i = 0; i < steps; i++) {
        const currentAngle = (i * 5) * Math.PI / 180;
        const startX = centerX + (radius - 2) * Math.cos(currentAngle - Math.PI / 2);
        const startY = centerY + (radius - 2) * Math.sin(currentAngle - Math.PI / 2);
        const endX = centerX + (radius - 2) * Math.cos((currentAngle + 5 * Math.PI / 180) - Math.PI / 2);
        const endY = centerY + (radius - 2) * Math.sin((currentAngle + 5 * Math.PI / 180) - Math.PI / 2);

        doc.line(startX, startY, endX, endY);
    }

    // Valor no centro
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${progress.toFixed(0)}%`, centerX, centerY + 5, { align: 'center', baseline: 'middle' });

    // Label abaixo
    if (label) {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textSecondary);
        doc.text(label, centerX, centerY + radius + 15, { align: 'center' });
    }
};

// Função para criar mini gráfico de linha
const drawMiniLineChart = (doc: jsPDF, x: number, y: number, width: number, height: number, data: number[], color: string = COLORS.primary) => {
    if (!data || data.length < 2) return;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const stepX = width / (data.length - 1);
    const chartHeight = height - 20;

    // Background
    doc.setFillColor(COLORS.background);
    doc.roundedRect(x, y, width, height, 4, 4, 'F');

    // Linha do gráfico
    doc.setDrawColor(color);
    doc.setLineWidth(2);
    doc.setLineCap('round');

    for (let i = 0; i < data.length - 1; i++) {
        const x1 = x + i * stepX;
        const y1 = y + height - 10 - ((data[i] - minValue) / range) * chartHeight;
        const x2 = x + (i + 1) * stepX;
        const y2 = y + height - 10 - ((data[i + 1] - minValue) / range) * chartHeight;

        doc.line(x1, y1, x2, y2);
    }

    // Pontos de dados
    doc.setFillColor(color);
    for (let i = 0; i < data.length; i++) {
        const pointX = x + i * stepX;
        const pointY = y + height - 10 - ((data[i] - minValue) / range) * chartHeight;
        doc.circle(pointX, pointY, 2, 'F');
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
    const sectionSpacing = 30;
    let y = 60;

    // --- CABEÇALHO COM GRADIENTE ---
    drawGradientBackground(doc, 0, 0, pageW, 110, COLORS.gradients.primary);

    // Logo BMV no cabeçalho de IA
    try {
        const logoWidth = 50;
        const logoHeight = 25;
        const logoX = pageW - margin - logoWidth;
        const logoY = 15;
        
        doc.addImage('/image/BMV.png', 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
        console.warn('Logo BMV não encontrado para relatório de IA');
    }

    doc.setTextColor(COLORS.background);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('UCS INDEX', margin, 40);

    // Ícone de IA
    doc.setFontSize(24);
    doc.text(getIcon('ai'), margin + 100, 40);

    doc.setFontSize(20);
    doc.text('Análise Inteligente de Mercado', margin, 65);
    doc.setFontSize(12);
    doc.text('Powered by Artificial Intelligence', margin, 85);

    // Informações no canto superior direito
    doc.setFontSize(10);
    doc.text(`Ativo: ${mainIndex?.name || 'N/A'}`, pageW - margin - 180, 40);
    doc.text(`Período: ${format(targetDate, "dd/MM/yyyy")}`, pageW - margin - 180, 55);
    doc.text(`Gerado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin - 180, 70);

    y = 140;

    if (!aiReportData) {
        drawModernCard(doc, margin, y, pageW - margin * 2, 80, 'Informação', 'Dados da análise de IA não encontrados.', COLORS.kpi.yellow);
        return doc;
    }

    // --- FUNÇÃO PARA DESENHAR SEÇÃO MELHORADA ---
    const drawAISection = (title: string, content: string, iconType: string, color: string = COLORS.primary) => {
        if (y > pageH - 200) {
            doc.addPage();
            y = 60;
        }

        // Sombra do card
        drawShadow(doc, margin, y, pageW - margin * 2, 120, 4);

        // Card principal
        doc.setFillColor(COLORS.background);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(margin, y, pageW - margin * 2, 120, 12, 12, 'FD');

        // Header com gradiente
        drawGradientBackground(doc, margin, y, pageW - margin * 2, 30, [color, COLORS.primaryLight]);

        // Ícone e título
        doc.setTextColor(COLORS.background);
        doc.setFontSize(16);
        doc.text(getIcon(iconType), margin + 15, y + 20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, margin + 35, y + 20);

        // Conteúdo
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const textLines = doc.splitTextToSize(content, pageW - margin * 2 - 40);
        doc.text(textLines, margin + 20, y + 50);

        // Separador decorativo
        drawSeparator(doc, margin + 20, y + 100, pageW - margin * 2 - 40, 'gradient');

        y += 130 + sectionSpacing;
    };

    // --- RENDERIZA AS SEÇÕES DO RELATÓRIO ---
    drawAISection('Resumo Executivo', aiReportData.executiveSummary, 'summary', COLORS.chart.c1);
    drawAISection('Análise de Tendência', aiReportData.trendAnalysis, 'trend-up', COLORS.chart.c4);
    drawAISection('Análise de Volatilidade', aiReportData.volatilityAnalysis, 'risk', COLORS.chart.c2);
    drawAISection('Conclusão', aiReportData.conclusion, 'recommendation', COLORS.chart.c3);

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
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate, marketSummary, volatilityMetrics, auditTrail, calculationDetails } = data;
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    // --- CABEÇALHO COMPLETAMENTE REDESENHADO ---
    // Background principal com gradiente sutil
    drawGradientBackground(doc, 0, 0, pageW, 140, [COLORS.backgroundSecondary, COLORS.background]);

    // Barra superior com logo e informações
    doc.setFillColor(COLORS.primary);
    doc.rect(0, 0, pageW, 8, 'F');

    // Logo BMV no cabeçalho executivo
    try {
        const logoWidth = 50;
        const logoHeight = 25;
        const logoX = pageW - margin - logoWidth;
        const logoY = 10;
        
        // Tentar diferentes caminhos para o logo
        const logoPaths = [
            '/image/BMV.png',
            './image/BMV.png',
            'image/BMV.png',
            'public/image/BMV.png'
        ];
        
        let logoAdded = false;
        for (const logoPath of logoPaths) {
            try {
                doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
                logoAdded = true;
                break;
            } catch (pathError) {
                // Continua tentando o próximo caminho
            }
        }
        
        if (!logoAdded) {
            // Fallback: criar um logo simples com texto
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8, 8, 'F');
            doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('BMV', logoX + logoWidth/2, logoY + logoHeight/2 + 2, { align: 'center' });
            doc.setTextColor(COLORS.textPrimary);
        }
    } catch (error) {
        console.warn('Logo BMV não encontrado para relatório executivo');
    }

    // Logo moderno
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.primary);
    doc.text('UCS INDEX', margin, 25);

    // Subtítulo do sistema
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textTertiary);
    doc.text('Sistema de Análise de Commodities', margin, 40);

    // Linha decorativa elegante
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(margin, 50, pageW - margin - 200, 50);

    // Círculo decorativo
    doc.setFillColor(COLORS.primary);
    doc.circle(pageW - margin - 180, 50, 4, 'F');

    // Título principal com hierarquia melhorada
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(COLORS.textPrimary);
    doc.text('Relatório Executivo', margin, 75);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.textSecondary);
    doc.text('Análise Abrangente de Mercado e Performance', margin, 95);

    // Card de data completamente redesenhado
    const dateCardWidth = 160;
    const dateCardHeight = 80;
    const dateCardX = pageW - margin - dateCardWidth;
    const dateCardY = 35;

    // Sombra do card
    doc.setFillColor(0, 0, 0, 0.08);
    doc.roundedRect(dateCardX + 3, dateCardY + 3, dateCardWidth, dateCardHeight, 12, 12, 'F');

    // Card principal com gradiente
    drawGradientBackground(doc, dateCardX, dateCardY, dateCardWidth, dateCardHeight, COLORS.gradients.primary);

    // Ícone de calendário moderno (ASCII seguro)
    doc.setFillColor(COLORS.background);
    doc.circle(dateCardX + 25, dateCardY + 25, 8, 'F');
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('◉', dateCardX + 21, dateCardY + 30);

    // Título do card
    doc.setTextColor(COLORS.background);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA DA ANÁLISE', dateCardX + 40, dateCardY + 25);

    // Data formatada
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const formattedDate = format(targetDate, "dd/MM/yyyy");
    doc.text(formattedDate, dateCardX + 40, dateCardY + 45);

    // Hora da análise
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentTime = format(new Date(), "HH:mm");
    doc.text(`Atualizado: ${currentTime}`, dateCardX + 40, dateCardY + 60);

    // Separador elegante
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.line(margin, 150, pageW - margin, 150);

    y = 180;

    // --- RESUMO DE MERCADO EXPANDIDO ---
    if (marketSummary) {
        // Sombra do card
        drawShadow(doc, margin, y, pageW - margin * 2, 120, 3);

        // Card principal
        doc.setFillColor(COLORS.background);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(margin, y, pageW - margin * 2, 120, 12, 12, 'FD');

        // Header com gradiente
        drawGradientBackground(doc, margin, y, pageW - margin * 2, 30, COLORS.gradients.primary);

        // Título
        doc.setTextColor(COLORS.background);
        doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
        doc.text('■ Resumo Geral do Mercado', margin + 15, y + 20);

        // Conteúdo do resumo
        const allAssets = [...(mainIndex ? [mainIndex] : []), ...secondaryIndices, ...currencies, ...otherAssets];
        const totalValue = allAssets.reduce((sum, asset) => sum + asset.price, 0);
        const avgChange = allAssets.length > 0 ? allAssets.reduce((sum, asset) => sum + (asset.change || 0), 0) / allAssets.length : 0;
        const positiveAssets = allAssets.filter(asset => (asset.change || 0) > 0).length;
        const negativeAssets = allAssets.filter(asset => (asset.change || 0) < 0).length;

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Linha 1: Total de ativos e valor
        doc.text(`Total de Ativos Monitorados: ${allAssets.length}`, margin + 20, y + 50);
        doc.text(`Valor Total do Portfolio: ${formatCurrency(totalValue, 'BRL', 'portfolio')}`, margin + 250, y + 50);

        // Linha 2: Performance média e distribuição
        doc.text(`Performance Media: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, margin + 20, y + 70);
        doc.text(`Ativos em Alta: ${positiveAssets} | Em Baixa: ${negativeAssets}`, margin + 200, y + 70);

        // Linha 3: Top performers
        const topPerformer = allAssets.reduce((top, asset) => (asset.change || 0) > (top.change || 0) ? asset : top, allAssets[0] || { name: 'N/A', change: 0 });
        const worstPerformer = allAssets.reduce((worst, asset) => (asset.change || 0) < (worst.change || 0) ? asset : worst, allAssets[0] || { name: 'N/A', change: 0 });

        doc.text(`Melhor Performance: ${topPerformer?.name || 'N/A'} (${topPerformer?.change?.toFixed(2) || '0.00'}%)`, margin + 20, y + 90);
        doc.text(`Pior Performance: ${worstPerformer?.name || 'N/A'} (${worstPerformer?.change?.toFixed(2) || '0.00'}%)`, margin + 250, y + 90);

        y += 140;
    }

    // --- BLOCOS DE KPI CORRIGIDOS SEM SOBREPOSIÇÃO ---
    const drawModernKpiBlock = (title: string, value: string, change: string, isPositive: boolean, x: number, yPos: number, width: number) => {
        const icon = isPositive ? getIcon('trend-up') : getIcon('trend-down');
        const color = isPositive ? COLORS.kpi.positive : COLORS.kpi.negative;
        const bgColor = isPositive ? COLORS.successLight : COLORS.errorLight;

        // Altura fixa para evitar sobreposição
        const cardHeight = 120;

        // Sombra suave
        doc.setFillColor(0, 0, 0, 0.06);
        doc.roundedRect(x + 2, yPos + 2, width, cardHeight, 16, 16, 'F');

        // Card principal com borda sutil
        doc.setFillColor(COLORS.surface);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(x, yPos, width, cardHeight, 16, 16, 'FD');

        // Header com altura fixa
        const headerHeight = 35;
        doc.setFillColor(bgColor);
        doc.roundedRect(x + 2, yPos + 2, width - 4, headerHeight, 14, 14, 'F');

        // Ícone no header (posição fixa)
        doc.setFillColor(color);
        doc.circle(x + 20, yPos + 18, 6, 'F');
        doc.setTextColor(COLORS.background);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(icon, x + 17, yPos + 22);

        // Título com altura limitada
        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(title, width - 60);
        // Limitar a 2 linhas máximo
        const limitedTitleLines = titleLines.slice(0, 2);
        doc.text(limitedTitleLines, x + 35, yPos + 22);

        // Valor principal com posição fixa
        doc.setTextColor(COLORS.textPrimary);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        // Quebrar valor se muito longo
        const valueLines = doc.splitTextToSize(value, width - 30);
        doc.text(valueLines[0], x + 15, yPos + 65);
        if (valueLines.length > 1) {
            doc.setFontSize(16);
            doc.text(valueLines[1], x + 15, yPos + 85);
        }

        // Indicador de mudança com posição fixa
        const changeY = yPos + 95;
        doc.setFillColor(color);
        doc.roundedRect(x + 15, changeY, Math.min(80, width - 30), 20, 10, 10, 'F');

        doc.setTextColor(COLORS.background);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${icon} ${change}`, x + 20, changeY + 13);

        // Badge de status (apenas se houver espaço)
        if (width > 120) {
            const statusText = isPositive ? 'POS' : 'NEG';
            doc.setFillColor(isPositive ? COLORS.success : COLORS.error);
            doc.roundedRect(x + width - 50, changeY, 35, 20, 8, 8, 'F');
            doc.setTextColor(COLORS.background);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(statusText, x + width - 32, changeY + 13, { align: 'center' });
        }
    };

    if (mainIndex) {
        const changeValue = typeof mainIndex.change === 'number' ? mainIndex.change : 0;
        drawModernKpiBlock(
            `Índice Principal: ${mainIndex.name}`,
            formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
            `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
            changeValue >= 0,
            margin, y, pageW - margin * 2
        );
        y += 140; // Espaçamento aumentado
    }

    const kpiAssets = [...secondaryIndices, ...currencies];
    const kpiCardWidth = (pageW - (margin * 2) - 30) / 2; // Reduzido para dar mais espaço

    if (kpiAssets.length > 0) {
        // Verificar se há espaço suficiente para 2 cards
        if (y > pageH - 180) {
            doc.addPage();
            y = 50;
        }

        const asset1 = kpiAssets[0];
        const change1 = typeof asset1.change === 'number' ? asset1.change : 0;
        drawModernKpiBlock(
            asset1.name,
            formatCurrency(asset1.price, asset1.currency, asset1.id),
            `${change1 >= 0 ? '+' : ''}${change1.toFixed(2)}%`,
            change1 >= 0,
            margin, y, kpiCardWidth
        );

    if (kpiAssets.length > 1) {
        const asset2 = kpiAssets[1];
        const change2 = typeof asset2.change === 'number' ? asset2.change : 0;
            drawModernKpiBlock(
            asset2.name,
            formatCurrency(asset2.price, asset2.currency, asset2.id),
                `${change2 >= 0 ? '+' : ''}${change2.toFixed(2)}%`,
            change2 >= 0,
                margin + kpiCardWidth + 15, y, kpiCardWidth
        );
    }
        y += 140; // Espaçamento aumentado
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

    // --- ANÁLISE DE VOLATILIDADE ---
    if (volatilityMetrics && y < pageH - 200) {
        if (y > pageH - 250) {
            doc.addPage();
            y = 50;
        }

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('! Análise de Volatilidade', margin, y);
        y += 25;

        // Card de volatilidade
        drawShadow(doc, margin, y, pageW - margin * 2, 100, 3);

        doc.setFillColor(COLORS.background);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(margin, y, pageW - margin * 2, 100, 8, 8, 'FD');

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Volatilidade geral
        doc.text(`Volatilidade Geral do Mercado: ${volatilityMetrics.overallVolatility.toFixed(2)}%`, margin + 20, y + 20);

        // Ativos de alta volatilidade
        if (volatilityMetrics.highVolatilityAssets.length > 0) {
            doc.text('Alta Volatilidade:', margin + 20, y + 40);
            volatilityMetrics.highVolatilityAssets.slice(0, 3).forEach((asset, index) => {
                doc.text(`• ${asset.name}: ${asset.volatility.toFixed(2)}%`, margin + 40, y + 55 + (index * 12));
            });
        }

        // Ativos de baixa volatilidade
        if (volatilityMetrics.lowVolatilityAssets.length > 0) {
            doc.text('Baixa Volatilidade:', margin + 250, y + 40);
            volatilityMetrics.lowVolatilityAssets.slice(0, 3).forEach((asset, index) => {
                doc.text(`• ${asset.name}: ${asset.volatility.toFixed(2)}%`, margin + 270, y + 55 + (index * 12));
            });
        }

        y += 120;
    }

    // --- TRAIL DE AUDITORIA ---
    if (auditTrail && auditTrail.length > 0 && y < pageH - 150) {
        if (y > pageH - 200) {
            doc.addPage();
            y = 50;
        }

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('● Últimas Alterações', margin, y);
        y += 25;

        // Tabela de auditoria
        const recentAudits = auditTrail.slice(0, 5);
        doc.autoTable({
            startY: y,
            head: [['Data', 'Ação', 'Ativo', 'Valor Anterior', 'Novo Valor', 'Usuário']],
            body: recentAudits.map(audit => [
                audit.timestamp,
                audit.action,
                audit.assetName,
                formatCurrency(audit.oldValue, 'BRL', audit.assetName),
                formatCurrency(audit.newValue, 'BRL', audit.assetName),
                audit.user
            ]),
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, textColor: 255 },
            styles: { cellPadding: 4, fontSize: 8 },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 20;
    }

    // --- DETALHES DE CÁLCULO ---
    if (calculationDetails && y < pageH - 100) {
        if (y > pageH - 150) {
            doc.addPage();
            y = 50;
        }

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('● Informações Técnicas', margin, y);
        y += 25;

        // Card de detalhes técnicos
        drawShadow(doc, margin, y, pageW - margin * 2, 80, 3);

        doc.setFillColor(COLORS.background);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(margin, y, pageW - margin * 2, 80, 8, 8, 'FD');

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        doc.text(`Tempo de Cálculo: ${calculationDetails.calculationTime}`, margin + 20, y + 20);
        doc.text(`Precisão: ${calculationDetails.performanceMetrics.accuracy.toFixed(2)}%`, margin + 200, y + 20);
        doc.text(`Memória Utilizada: ${calculationDetails.performanceMetrics.memoryUsage.toFixed(2)} MB`, margin + 350, y + 20);

        if (calculationDetails.errors.length > 0) {
            doc.text(`Avisos/Erros: ${calculationDetails.errors.length}`, margin + 20, y + 40);
            calculationDetails.errors.slice(0, 2).forEach((error, index) => {
                const errorColor = error.severity === 'error' ? COLORS.kpi.red : COLORS.kpi.yellow;
                doc.setTextColor(errorColor);
                doc.text(`• ${error.asset}: ${error.error}`, margin + 20, y + 55 + (index * 12));
            });
        }

        y += 100;
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
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate, marketInsights, performanceMetrics, riskAnalysis, marketSummary, correlationAnalysis } = data;

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const sectionSpacing = 30;
    const elementSpacing = 20;
    let y = 60;

    // --- CABEÇALHO COMERCIAL COM LOGO BMV ---
    doc.setFillColor(22, 101, 52); // green-800
    doc.roundedRect(0, 0, pageW, 100, 0, 0, 'F');

    // Logo BMV no cabeçalho comercial
    try {
        const logoWidth = 50;
        const logoHeight = 25;
        const logoX = pageW - margin - logoWidth;
        const logoY = 15;
        
        doc.addImage('/image/BMV.png', 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
        console.warn('Logo BMV não encontrado para relatório comercial');
    }

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
    doc.text('■ Resumo Executivo', margin + 20, y + 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textSecondary);
    const summaryText = mainIndex
        ? `O índice principal ${mainIndex.name} apresentou performance ${mainIndex.change && mainIndex.change > 0 ? 'positiva' : 'negativa'} de ${mainIndex.change?.toFixed(2) || '0.00'}% no período analisado. O mercado demonstra ${riskAnalysis?.overallRisk === 'low' ? 'baixo risco' : riskAnalysis?.overallRisk === 'medium' ? 'risco moderado' : 'alto risco'} com tendências ${marketInsights && marketInsights.length > 0 ? 'diversas' : 'estáveis'}.`
        : 'Análise completa do mercado com foco em commodities e ativos correlacionados.';

    const splitText = doc.splitTextToSize(summaryText, pageW - margin * 2 - 40);
    doc.text(splitText, margin + 20, y + 45);
    y += 120;

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
        doc.text('▲ Métricas de Performance', margin, y);
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
        doc.text('! Análise de Riscos', margin, y);
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
        doc.text('● Insights de Mercado', margin, y);
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
    doc.text('■ Performance Detalhada dos Ativos', margin, y);
    y += elementSpacing + 5;

    const allAssets = [...(mainIndex ? [mainIndex] : []), ...secondaryIndices, ...currencies, ...otherAssets];
    if (allAssets.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Ativo', 'Categoria', 'Valor', 'Variação', 'Status']],
            body: allAssets.map(asset => {
                const changeValue = typeof asset.change === 'number' ? asset.change : 0;
                const status = changeValue > 0 ? '▲ Alta' : changeValue < 0 ? '▼ Baixa' : '● Estável';
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

    // --- ANÁLISE DE CORRELAÇÃO ---
    if (correlationAnalysis && y < pageH - 250) {
        if (y > pageH - 300) {
            doc.addPage();
            y = 60;
        }

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('◆ Análise de Correlação de Ativos', margin, y);
        y += elementSpacing + 5;

        // Card de correlação
        drawShadow(doc, margin, y, pageW - margin * 2, 120, 3);

        doc.setFillColor(COLORS.background);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(1);
        doc.roundedRect(margin, y, pageW - margin * 2, 120, 8, 8, 'FD');

        doc.setTextColor(COLORS.textPrimary);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Score de diversificação
        doc.text(`Score de Diversificação: ${correlationAnalysis.diversificationScore.toFixed(2)}/10`, margin + 20, y + 20);

        // Correlações fortes
        if (correlationAnalysis.strongCorrelations.length > 0) {
            doc.text('Correlações Fortes (>0.7):', margin + 20, y + 40);
            correlationAnalysis.strongCorrelations.slice(0, 3).forEach((corr, index) => {
                doc.text(`• ${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(3)}`, margin + 40, y + 55 + (index * 12));
            });
        }

        // Correlações fracas
        if (correlationAnalysis.weakCorrelations.length > 0) {
            doc.text('Correlações Fracas (<0.3):', margin + 250, y + 40);
            correlationAnalysis.weakCorrelations.slice(0, 3).forEach((corr, index) => {
                doc.text(`• ${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(3)}`, margin + 270, y + 55 + (index * 12));
            });
        }

        // Interpretação
        const diversificationText = correlationAnalysis.diversificationScore > 7 ? 'Excelente diversificação' :
            correlationAnalysis.diversificationScore > 5 ? 'Boa diversificação' :
                'Diversificação limitada';
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(correlationAnalysis.diversificationScore > 7 ? COLORS.kpi.green :
            correlationAnalysis.diversificationScore > 5 ? COLORS.kpi.yellow : COLORS.kpi.red);
        doc.text(`Status: ${diversificationText}`, margin + 20, y + 100);

        y += 140;
    }

    // --- RECOMENDAÇÕES ESTRATÉGICAS ---
    if (y > pageH - 150) {
        doc.addPage();
        y = 50;
    }

    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('● Recomendações Estratégicas', margin, y);
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
    const trendIcon = metric.trend === 'up' ? getIcon('trend-up') : metric.trend === 'down' ? getIcon('trend-down') : getIcon('trend-stable');
    const trendColor = metric.trend === 'up' ? COLORS.kpi.green : metric.trend === 'down' ? COLORS.kpi.red : COLORS.textSecondary;

    // Sombra sutil
    drawShadow(doc, x, y, width, 80, 2);

    // Card principal
    doc.setFillColor(COLORS.background);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, 80, 8, 8, 'FD');

    // Header com gradiente
    drawGradientBackground(doc, x, y, width, 20, [trendColor, COLORS.primaryLight]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.background);
    const nameLines = doc.splitTextToSize(metric.name, width - 20);
    doc.text(nameLines, x + 10, y + 13);

    doc.setFontSize(16);
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    const valueText = `${metric.value.toFixed(2)} ${metric.unit}`;
    doc.text(valueText, x + 10, y + 35);

    doc.setFontSize(10);
    doc.setTextColor(trendColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${trendIcon} ${metric.period}`, x + 10, y + 55);
};

const drawMarketInsightBlock = (insight: MarketInsight, x: number, y: number, width: number, doc: jsPDF) => {
    const impactColor = COLORS.insight[insight.impact];
    const impactIcon = insight.impact === 'positive' ? getIcon('success') : insight.impact === 'negative' ? getIcon('warning') : getIcon('info');

    // Sombra
    drawShadow(doc, x, y, width, 85, 3);

    // Card principal
    doc.setFillColor(COLORS.background);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(1);
    doc.roundedRect(x, y, width, 85, 10, 10, 'FD');

    // Header com gradiente
    drawGradientBackground(doc, x, y, width, 25, [impactColor, COLORS.primaryLight]);

    // Título com ícone
    doc.setTextColor(COLORS.background);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(impactIcon, x + 15, y + 17);
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(insight.title, width - 50);
    doc.text(titleLines, x + 30, y + 17);

    // Conteúdo
    doc.setTextColor(COLORS.textPrimary);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descText = doc.splitTextToSize(insight.description, width - 30);
    doc.text(descText, x + 15, y + 40);

    // Indicador de confiança com badge
    doc.setFillColor(impactColor);
    doc.roundedRect(x + width - 70, y + 55, 60, 20, 10, 10, 'F');
    doc.setTextColor(COLORS.background);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${insight.confidence}%`, x + width - 40, y + 67, { align: 'center' });
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
                    doc.text('■ Gráfico: ' + section.content, margin + 20, y + 40);
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
        const trendIcon = kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '●';
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

    // --- CABEÇALHO COM LOGO BMV ---
    // Logo BMV no canto superior direito
    try {
        const logoWidth = 60;
        const logoHeight = 30;
        const logoX = pageW - margin - logoWidth;
        const logoY = y;
        
        // Tentar diferentes caminhos para o logo
        const logoPaths = [
            '/image/BMV.png',
            './image/BMV.png',
            'image/BMV.png',
            'public/image/BMV.png'
        ];
        
        let logoAdded = false;
        for (const logoPath of logoPaths) {
            try {
                doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
                logoAdded = true;
                break;
            } catch (pathError) {
                // Continua tentando o próximo caminho
            }
        }
        
        if (!logoAdded) {
            // Fallback: criar um logo simples com texto
            doc.setFillColor(COLORS.primary);
            doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8, 8, 'F');
            doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('BMV', logoX + logoWidth/2, logoY + logoHeight/2 + 2, { align: 'center' });
            doc.setTextColor(COLORS.textPrimary);
        }
    } catch (error) {
        console.warn('Logo BMV não encontrado, continuando sem logo');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.text('ANÁLISE DE COMPOSIÇÃO', margin, y);
    y += 60; // Espaçamento aumentado

    doc.setFontSize(32); // Título maior
    doc.setTextColor(COLORS.textPrimary);
    doc.text(mainIndex?.name || 'Índice de Composição', margin, y);
    y += 45; // Espaçamento aumentado
    doc.setFontSize(18);
    doc.setTextColor(COLORS.textSecondary);
    doc.text(`Dados de ${format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
    y += 100; // Espaçamento aumentado para separar melhor do conteúdo

    // --- BLOCOS DE KPI DE COMPONENTES CIRCULARES ---
    const drawCompositionKpiBlock = (title: string, value: string, percentage: string, x: number, yPos: number, width: number, cardIndex: number) => {
        // Cores variadas para cada card
        const cardColors = [
            COLORS.gradients.primary,      // Azul
            COLORS.gradients.secondary,    // Verde
            COLORS.gradients.warning,      // Amarelo
            COLORS.gradients.error,        // Vermelho
            COLORS.gradients.success,      // Verde claro
            COLORS.gradients.neutral       // Cinza
        ];

        const cardColor = cardColors[cardIndex % cardColors.length];
        const radius = Math.min(width / 2, 75); // Raio ligeiramente maior
        const centerX = x + width / 2;
        const centerY = yPos + radius + 30; // Mais espaço para o título

        // Sombra mais proeminente em múltiplas camadas
        doc.setFillColor(0, 0, 0, 0.18);
        doc.circle(centerX + 4, centerY + 4, radius, 'F');
        doc.setFillColor(0, 0, 0, 0.12);
        doc.circle(centerX + 2, centerY + 2, radius, 'F');
        doc.setFillColor(0, 0, 0, 0.06);
        doc.circle(centerX + 1, centerY + 1, radius, 'F');

        // Círculo principal colorido
        doc.setFillColor(cardColor[0]);
        doc.circle(centerX, centerY, radius, 'F');
        
        // Borda branca para destaque
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.circle(centerX, centerY, radius, 'S');

        // Porcentagem no centro do círculo (branca)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(COLORS.background);
        doc.text(percentage, centerX, centerY + 8, { align: 'center' });

        // Título abaixo do círculo com melhor espaçamento
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.textPrimary);
        const titleLines = doc.splitTextToSize(title, width - 15);
        const titleY = centerY + radius + 45; // Mais espaço entre círculo e texto
        
        // Adicionar sombra sutil ao texto
        doc.setTextColor(0, 0, 0, 0.3);
        doc.text(titleLines.slice(0, 2), centerX + 1, titleY + 1, { align: 'center' });
        
        // Texto principal
        doc.setTextColor(COLORS.textPrimary);
        doc.text(titleLines.slice(0, 2), centerX, titleY, { align: 'center' });
    };

    const allComponents = components || [];
    const cardsPerRow = 3; // 3 cards por linha
    const cardSpacing = 30; // Espaçamento aumentado entre os cards
    const kpiCardWidth = (pageW - (margin * 2) - (cardSpacing * (cardsPerRow - 1))) / cardsPerRow; // Largura para 3 cards

    if (allComponents.length > 0) {
        // Filtrar apenas componentes principais (sem subcomponentes)
        const mainComponentsForCards = allComponents.filter(c =>
            !c.name.includes('Carbono') && !c.name.includes('Água')
        );

        // Dividir componentes em grupos de 3
        const rows = [];
        for (let i = 0; i < mainComponentsForCards.length; i += cardsPerRow) {
            rows.push(mainComponentsForCards.slice(i, i + cardsPerRow));
        }

        let globalCardIndex = 0;

        rows.forEach((row, rowIndex) => {
            // Verificar se há espaço suficiente para a linha (círculos + título + espaçamento)
            if (y > pageH - 220) {
                doc.addPage();
                y = 50;
            }

            row.forEach((component, cardIndex) => {
                const xPosition = margin + (kpiCardWidth + cardSpacing) * cardIndex;
            drawCompositionKpiBlock(
                component.name,
                formatCurrency(component.price, component.currency, component.id),
                    `${(component.change || 0).toFixed(2)}%`,
                    xPosition,
                y,
                kpiCardWidth,
                    globalCardIndex
                );
                globalCardIndex++;
            });

                y += 220; // Espaçamento aumentado entre linhas (círculos + título + espaço extra)
        });
    }



    // --- TABELA RESUMO COM HIERARQUIA ---
    y += 20; // Espaçamento extra antes da tabela
    
    // Fundo sutil para o título da tabela
    doc.setFillColor(COLORS.backgroundSecondary);
    doc.roundedRect(margin - 10, y - 5, pageW - margin * 2 + 20, 35, 8, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18); // Título da tabela maior
    doc.setTextColor(COLORS.textPrimary);
    doc.text('Resumo da Composição', margin, y + 10);
    
    // Linha decorativa abaixo do título
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(2);
    doc.line(margin, y + 20, margin + 200, y + 20);
    
    y += 50; // Espaçamento aumentado antes da tabela

    if (allComponents.length > 0) {
        // Separar componentes principais dos subcomponentes
        const mainComponents = allComponents.filter(c => !c.name.includes('Carbono') && !c.name.includes('Água'));
        const crsComponent = allComponents.find(c => c.name.includes('CRS'));
        const subComponents = allComponents.filter(c => c.name.includes('Carbono') || c.name.includes('Água'));

        // Preparar dados da tabela com hierarquia
        const tableData: any[] = [];

        // Adicionar componentes principais
        mainComponents.forEach(c => {
            tableData.push([
                c.name,
                formatCurrency(c.price, c.currency, c.id),
                `${(c.change || 0).toFixed(2)}%`
            ]);
        });

        // Adicionar CRS principal
        if (crsComponent) {
            tableData.push([
                crsComponent.name,
                formatCurrency(crsComponent.price, crsComponent.currency, crsComponent.id),
                `${(crsComponent.change || 0).toFixed(2)}%`
            ]);

            // Adicionar subcomponentes do CRS
            subComponents.forEach(c => {
                tableData.push([
                    `    - ${c.name}`,
                    formatCurrency(c.price, c.currency, c.id),
                    `${(c.change || 0).toFixed(2)}%`
                ]);
            });
        }

        doc.autoTable({
            startY: y,
            head: [['Componente', 'Valor', 'Participação (%)']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: COLORS.textPrimary, textColor: 255 },
            styles: { cellPadding: 6, fontSize: 10 },
            didParseCell: (data: any) => {
                // Estilizar subcomponentes
                if (data.cell.raw && typeof data.cell.raw === 'string' && data.cell.raw.includes(' - ')) {
                    data.cell.styles.fontStyle = 'normal';
                    data.cell.styles.fontSize = 9;
                    data.cell.styles.textColor = [107, 114, 128]; // gray-500
                }
                // Destacar CRS principal
                else if (data.cell.raw && typeof data.cell.raw === 'string' && data.cell.raw.includes('CRS')) {
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
        y = (doc as any).lastAutoTable.finalY;
    }

    // --- VALOR TOTAL MELHORADO ---
    if (mainIndex) {
        y += 40; // Espaçamento extra antes da seção
        
        // Sombra mais pronunciada em múltiplas camadas
        doc.setFillColor(0, 0, 0, 0.08);
        doc.roundedRect(margin + 3, y + 3, pageW - margin * 2, 70, 10, 10, 'F');
        doc.setFillColor(0, 0, 0, 0.05);
        doc.roundedRect(margin + 2, y + 2, pageW - margin * 2, 70, 10, 10, 'F');
        
        // Card principal com gradiente sutil
        doc.setFillColor(248, 250, 252); // gray-50 mais claro
        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(2);
        doc.roundedRect(margin, y, pageW - margin * 2, 70, 10, 10, 'FD');
        
        // Ícone decorativo
        doc.setFillColor(COLORS.primary);
        doc.circle(margin + 35, y + 35, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('$', margin + 35, y + 39, { align: 'center' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16); // Fonte maior
        doc.setTextColor(COLORS.textSecondary);
        doc.text('Valor Total do Índice', margin + 60, y + 35);
        
        doc.setFontSize(28); // Valor maior
        doc.setTextColor(COLORS.textPrimary);
        doc.text(formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id), pageW - margin - 30, y + 35, { align: 'right' });
        
        // Linha decorativa no final
        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(1);
        doc.line(margin + 60, y + 50, pageW - margin - 30, y + 50);
        
        y += 100; // Espaçamento aumentado
    }

    // --- RODAPÉ COM LOGO BMV ---
    for (let i = 1; i <= doc.internal.pages.length; i++) {
        doc.setPage(i);
        
        // Linha separadora com gradiente
        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(1);
        doc.line(margin, pageH - 45, pageW - margin, pageH - 45);
        
        // Linha sutil adicional
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
        
        // Logo BMV pequeno no rodapé
        try {
            const footerLogoWidth = 25;
            const footerLogoHeight = 12;
            const footerLogoX = pageW - margin - footerLogoWidth;
            const footerLogoY = pageH - 35;
            
            // Tentar diferentes caminhos para o logo
            const logoPaths = [
                '/image/BMV.png',
                './image/BMV.png',
                'image/BMV.png',
                'public/image/BMV.png'
            ];
            
            let logoAdded = false;
            for (const logoPath of logoPaths) {
                try {
                    doc.addImage(logoPath, 'PNG', footerLogoX, footerLogoY, footerLogoWidth, footerLogoHeight);
                    logoAdded = true;
                    break;
                } catch (pathError) {
                    // Continua tentando o próximo caminho
                }
            }
            
            if (!logoAdded) {
                // Fallback: criar um logo simples com texto
                doc.setFillColor(COLORS.primary);
                doc.roundedRect(footerLogoX, footerLogoY, footerLogoWidth, footerLogoHeight, 4, 4, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text('BMV', footerLogoX + footerLogoWidth/2, footerLogoY + footerLogoHeight/2 + 1, { align: 'center' });
                doc.setTextColor(COLORS.textPrimary);
            }
        } catch (error) {
            console.warn('Logo BMV não encontrado para rodapé, continuando sem logo');
        }
        
        // Texto do rodapé
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Confidencial | UCS Index`, margin, pageH - 25);
        doc.text(`Página ${i}`, pageW - margin - 30, pageH - 25, { align: 'right' }); // Ajustado para não sobrepor o logo
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
            if (data.mainIndex) {
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
