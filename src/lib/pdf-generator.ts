'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData } from './types';
import { formatCurrency } from './formatters';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => jsPDFWithAutoTable;
}

// Interfaces melhoradas para tipagem
interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  theme?: 'striped' | 'grid' | 'plain';
  margin?: { left?: number; right?: number };
  headStyles?: {
    fillColor?: number[] | string;
    fontStyle?: 'normal' | 'bold' | 'italic';
    textColor?: number[] | string;
  };
  styles?: {
    cellPadding?: number;
    fontSize?: number;
  };
  didParseCell?: (data: any) => void;
  didDrawPage?: (data: any) => void;
}

type PdfTemplate = 'simple' | 'complete' | 'executive';

export interface DashboardPdfData {
    mainIndex?: CommodityPriceData;
    secondaryIndices: CommodityPriceData[];
    currencies: CommodityPriceData[];
    otherAssets: CommodityPriceData[];
    targetDate: Date;
}

interface PdfTheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    danger: string;
    light: string;
}

interface PdfMetrics {
    totalAssets: number;
    positiveChanges: number;
    negativeChanges: number;
    avgChange: number;
    maxChange: number;
    minChange: number;
    totalVolume: number;
    volatility: number;
    stabilityIndex: number;
    diversificationRate: number;
}

// Temas pré-definidos
const themes: Record<string, PdfTheme> = {
    corporate: {
        primary: '#1e3a8a',
        secondary: '#3b82f6',
        accent: '#16a34a',
        background: '#f8fafc',
        text: '#000000',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        light: '#dbeafe'
    },
    modern: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#f1f5f9',
        text: '#1e293b',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        light: '#e0e7ff'
    },
    classic: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#059669',
        background: '#ffffff',
        text: '#111827',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#dc2626',
        light: '#f3f4f6'
    }
};

// Função para calcular métricas
function calculateMetrics(data: DashboardPdfData): PdfMetrics {
    const allAssets = [data.mainIndex, ...data.secondaryIndices, ...data.currencies, ...data.otherAssets]
        .filter((asset): asset is CommodityPriceData => asset !== undefined);
    
    const totalAssets = allAssets.length;
    const positiveChanges = allAssets.filter(asset => asset.change > 0).length;
    const negativeChanges = allAssets.filter(asset => asset.change < 0).length;
    const avgChange = totalAssets > 0 ? allAssets.reduce((sum, asset) => sum + asset.change, 0) / totalAssets : 0;
    const maxChange = totalAssets > 0 ? Math.max(...allAssets.map(asset => asset.change)) : 0;
    const minChange = totalAssets > 0 ? Math.min(...allAssets.map(asset => asset.change)) : 0;
    const totalVolume = allAssets.reduce((sum, asset) => sum + Math.abs(asset.absoluteChange), 0);
    const volatility = totalAssets > 0 ? Math.sqrt(allAssets.reduce((sum, asset) => sum + Math.pow(asset.change - avgChange, 2), 0) / totalAssets) : 0;
    const stabilityIndex = Math.max(0, 100 - (volatility * 10));
    const diversificationRate = totalAssets > 0 ? (positiveChanges / totalAssets) * 100 : 0;

    return {
        totalAssets,
        positiveChanges,
        negativeChanges,
        avgChange,
        maxChange,
        minChange,
        totalVolume,
        volatility,
        stabilityIndex,
        diversificationRate
    };
}

// Função para validar dados
function validateData(data: DashboardPdfData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.targetDate || isNaN(data.targetDate.getTime())) {
        errors.push('Data de destino inválida');
    }
    
    if (!data.mainIndex && data.secondaryIndices.length === 0 && data.currencies.length === 0 && data.otherAssets.length === 0) {
        errors.push('Nenhum dado de ativo disponível');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Função para criar círculo com gradiente simulado
function createGradientCircle(doc: jsPDF, x: number, y: number, radius: number, color: string, percentage: number) {
    // Círculo principal
    doc.setFillColor(color);
    doc.circle(x, y, radius, 'F');
    
    // Círculo interno para simular gradiente
    const innerRadius = radius * 0.7;
    doc.setFillColor('#ffffff');
    doc.circle(x, y, innerRadius, 'F');
    
    // Círculo de progresso (simulado)
    const progressRadius = radius * 0.6;
    const progressColor = percentage >= 70 ? themes.corporate.success : 
                         percentage >= 50 ? themes.corporate.warning : 
                         themes.corporate.danger;
    
    doc.setFillColor(progressColor);
    doc.circle(x, y, progressRadius, 'F');
}

// Função para criar ícone estilizado
function createStyledIcon(doc: jsPDF, x: number, y: number, icon: string, size: number, color: string) {
    doc.setTextColor(color);
    doc.setFontSize(size);
    doc.text(icon, x, y);
}

// Função para criar texto com sombra
function createTextWithShadow(doc: jsPDF, text: string, x: number, y: number, options: any = {}) {
    const shadowOffset = 1;
    const shadowColor = options.shadowColor || '#000000';
    const textColor = options.textColor || '#000000';
    
    // Sombra
    doc.setTextColor(shadowColor);
    doc.text(text, x + shadowOffset, y + shadowOffset);
    
    // Texto principal
    doc.setTextColor(textColor);
    doc.text(text, x, y);
}

const generateSimpleDashboardPdf = (data: DashboardPdfData, themeName: string = 'corporate'): jsPDF => {
    const validation = validateData(data);
    if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const theme = themes[themeName] || themes.corporate;
    const { mainIndex, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    // Fundo
    doc.setFillColor(theme.background);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
    
    // Cabeçalho melhorado
    doc.setTextColor(theme.primary);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    createTextWithShadow(doc, 'Relatório de Cotações Simplificado', 15, 25, { 
        shadowColor: theme.light, 
        textColor: theme.primary 
    });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.text);
    doc.text(`Data: ${formattedDate}`, 15, 35);

    if (mainIndex) {
        doc.autoTable({
            startY: 45,
            head: [['Índice Principal', 'Valor', 'Variação']],
            body: [[
                mainIndex.name, 
                formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id),
                `${mainIndex.change >= 0 ? '+' : ''}${mainIndex.change.toFixed(2)}%`
            ]],
            theme: 'striped',
            headStyles: { 
                fillColor: theme.primary, 
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
                        data.cell.styles.textColor = theme.success;
                    } else if (cellValue.startsWith('-')) {
                        data.cell.styles.textColor = theme.danger;
                    }
                }
            }
        });
    }

    if (otherAssets.length > 0) {
    doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Ativo', 'Preço', 'Variação']],
        body: otherAssets.map(asset => [
            asset.name,
            formatCurrency(asset.price, asset.currency, asset.id),
                `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`
        ]),
        theme: 'grid',
            headStyles: { 
                fillColor: theme.secondary, 
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
                        data.cell.styles.textColor = theme.success;
                    } else if (cellValue.startsWith('-')) {
                        data.cell.styles.textColor = theme.danger;
                    }
                }
            }
        });
    }

    return doc;
};

const generateCompleteDashboardPdf = (data: DashboardPdfData, themeName: string = 'corporate'): jsPDF => {
    const validation = validateData(data);
    if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const theme = themes[themeName] || themes.corporate;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const generationDate = format(new Date(), "dd/MM/yyyy HH:mm");
    let finalY = 20;

    // Fundo
    doc.setFillColor(theme.background);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    // --- Cabeçalho melhorado ---
    doc.setTextColor(theme.primary);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    createTextWithShadow(doc, 'Painel de Cotações', 15, finalY, { 
        shadowColor: theme.light, 
        textColor: theme.primary 
    });
    finalY += 12;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(theme.text);
    doc.text(`Dados para: ${formattedDate}`, 15, finalY);
    finalY += 20;

    // --- Função para gerar seção melhorada ---
    const generateSection = (title: string, assets: CommodityPriceData[], color: string) => {
      if (!assets || assets.length === 0) return;

      // Cabeçalho da seção com estilo
      doc.setFillColor(color);
      doc.roundedRect(15, finalY - 5, doc.internal.pageSize.getWidth() - 30, 20, 5, 5, 'F');
      
      doc.setTextColor('#ffffff');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, finalY + 8);
      finalY += 25;

      const head = [['Ativo', 'Último Preço', 'Variação (24h)', 'Variação Absoluta']];
      const body = assets.map(asset => {
        const changeText = `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`;
        const absChangeText = `${asset.absoluteChange >= 0 ? '+' : ''}${asset.absoluteChange.toFixed(2)}`;
        return [
            asset.name, 
            formatCurrency(asset.price, asset.currency, asset.id), 
            changeText,
            absChangeText
        ];
      });

      doc.autoTable({
        startY: finalY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { 
            fillColor: color, 
            fontStyle: 'bold',
            textColor: '#ffffff'
        },
        styles: { 
            cellPadding: 8, 
            fontSize: 10 
        },
        didParseCell: (data: any) => {
           if ((data.column.index === 2 || data.column.index === 3) && data.section === 'body') {
              const cellValue = data.cell.raw as string;
              if(cellValue.startsWith('+')) {
                  data.cell.styles.textColor = theme.success;
              } else if (cellValue.startsWith('-')) {
                  data.cell.styles.textColor = theme.danger;
              }
           }
        }
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    };
    
    // --- Gera seções com cores diferentes ---
    if(mainIndex) generateSection('Índice Principal', [mainIndex], theme.primary);
    if(secondaryIndices.length > 0) generateSection('Índices Secundários', secondaryIndices, theme.secondary);
    if(currencies.length > 0) generateSection('Moedas', currencies, theme.accent);
    if(otherAssets.length > 0) generateSection('Commodities e Outros Ativos', otherAssets, theme.warning);
    
    // --- Rodapé melhorado ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(theme.primary);
      doc.setLineWidth(1);
      doc.line(15, doc.internal.pageSize.getHeight() - 25, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 25);
      
      doc.setFontSize(10);
      doc.setTextColor(theme.text);
      doc.text(
        `Página ${i} de ${pageCount} | Relatório gerado em ${generationDate} | UCS Index`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return doc;
};

const generateExecutiveDashboardPdf = (data: DashboardPdfData, themeName: string = 'corporate'): jsPDF => {
    const validation = validateData(data);
    if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    const doc = new jsPDF('p', 'pt') as jsPDFWithAutoTable;
    const theme = themes[themeName] || themes.corporate;
    const metrics = calculateMetrics(data);
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "MMMM dd, yyyy", { locale: ptBR });
    const reportDate = format(targetDate, "MMMM dd, yyyy", { locale: ptBR });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    let y = 50;

    // --- FUNDO BRANCO LIMPO ---
    doc.setFillColor('#ffffff');
    doc.rect(0, 0, pageW, pageH, 'F');

    // --- CABEÇALHO CORPORATIVO REFINADO (Seguindo exatamente o design de referência) ---
    // Logo da empresa (mais elegante)
    doc.setTextColor('#4b5563'); // gray-600
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UCS INDEX CORP.', margin, y);
    y += 10;

    // Linha separadora mais elegante
    doc.setDrawColor('#d1d5db'); // gray-300
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageW - margin, y);
    y += 25;

    // Título principal (mais impactante como no design de referência)
    doc.setTextColor('#1e40af'); // blue-800
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Executivo de', margin, y);
    y += 45;
    
    doc.setTextColor('#16a34a'); // green-600
    doc.setFontSize(42);
    doc.setFont('helvetica', 'bold');
    doc.text('Ativos e Índices', margin, y);
    y += 60;

    // Banner de destaques (exatamente como no design de referência)
    const bannerWidth = 300;
    const bannerHeight = 85;
    const bannerX = pageW - margin - bannerWidth;
    const bannerY = 50;

    // Banner principal com cantos mais arredondados
    doc.setFillColor('#16a34a'); // green-600
    doc.roundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 12, 12, 'F');
    
    // Cauda do banner mais elegante (triângulo apontando para a esquerda)
    doc.setFillColor('#16a34a');
    doc.triangle(bannerX - 25, bannerY + 30, bannerX, bannerY + 20, bannerX, bannerY + 40, 'F');

    doc.setTextColor('#ffffff');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Destaques do Mercado', bannerX + 25, bannerY + 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDate, bannerX + 25, bannerY + 50);

    y = bannerY + bannerHeight + 50;

    // --- INTRODUÇÃO ELEGANTE ---
    doc.setTextColor('#374151'); // gray-700
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Prezados Diretores,', margin, y);
    y += 25;
    
    const introText = 'Temos o prazer de compartilhar uma visão concisa do desempenho dos nossos principais ativos e índices para o período encerrado em ' + format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) + '.';
    const introLines = doc.splitTextToSize(introText, pageW - (margin * 2));
    doc.text(introLines, margin, y);
    y += introLines.length * 18 + 40;

    // --- SEÇÃO DE KPIs REFINADA (Seguindo exatamente o design de referência) ---
    const kpiSectionY = y;
    const kpiWidth = (pageW - (margin * 2) - 20) / 2;

    // KPI 1: Performance Financeira (Layout exato do design de referência)
    doc.setFillColor('#1e40af'); // blue-800
    doc.roundedRect(margin, kpiSectionY, kpiWidth, 180, 8, 8, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Financeira:', margin + 25, kpiSectionY + 30);

    // Primeiro círculo - Performance do Índice Principal (mais elegante)
    const circle1X = margin + 80;
    const circle1Y = kpiSectionY + 70;
    const circle1Radius = 35;
    
    // Círculo com borda e sombra sutil
    doc.setFillColor('#e0f2fe'); // blue-50 (mais claro)
    doc.circle(circle1X, circle1Y, circle1Radius, 'F');
    
    // Borda do círculo
    doc.setDrawColor('#0ea5e9'); // sky-500
    doc.setLineWidth(2);
    doc.circle(circle1X, circle1Y, circle1Radius, 'S');
    
    // Ícone no centro (mais elegante)
    doc.setTextColor('#0ea5e9'); // sky-500
    doc.setFontSize(18);
    doc.text('📈', circle1X - 6, circle1Y + 4);
    
    // Percentual grande ao lado (como no design de referência)
    const performanceColor = metrics.avgChange >= 0 ? '#16a34a' : '#dc2626';
    doc.setTextColor(performanceColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metrics.avgChange >= 0 ? '+' : ''}${metrics.avgChange.toFixed(1)}%`, circle1X + 60, circle1Y + 8);

    // Texto descritivo (mais organizado)
    doc.setTextColor('#1f2937'); // gray-800
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Índice Principal:', circle1X - 15, circle1Y + 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(mainIndex ? formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id) : 'N/A', circle1X - 15, circle1Y + 70);
    doc.text(`Performance média: ${metrics.avgChange.toFixed(1)}%`, circle1X - 15, circle1Y + 85);

    // Segundo círculo - Diversificação (mais elegante)
    const circle2X = margin + 80;
    const circle2Y = kpiSectionY + 130;
    const circle2Radius = 30;
    
    // Círculo com borda e sombra sutil
    doc.setFillColor('#e0f2fe'); // blue-50
    doc.circle(circle2X, circle2Y, circle2Radius, 'F');
    
    // Borda do círculo
    doc.setDrawColor('#0ea5e9'); // sky-500
    doc.setLineWidth(2);
    doc.circle(circle2X, circle2Y, circle2Radius, 'S');
    
    // Ícone no centro
    doc.setTextColor('#0ea5e9'); // sky-500
    doc.setFontSize(16);
    doc.text('💼', circle2X - 5, circle2Y + 3);
    
    // Percentual ao lado
    const diversificationColor = metrics.diversificationRate >= 50 ? '#16a34a' : '#f59e0b';
    doc.setTextColor(diversificationColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metrics.diversificationRate.toFixed(0)}%`, circle2X + 50, circle2Y + 5);

    // Texto descritivo
    doc.setTextColor('#1f2937'); // gray-800
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Diversificação:', circle2X - 12, circle2Y + 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${metrics.positiveChanges} ativos positivos`, circle2X - 12, circle2Y + 60);
    doc.text(`de ${metrics.totalAssets} total`, circle2X - 12, circle2Y + 75);

    // KPI 2: Conquistas Operacionais (Layout exato do design de referência)
    doc.setFillColor('#1e40af'); // blue-800
    doc.roundedRect(margin + kpiWidth + 20, kpiSectionY, kpiWidth, 180, 8, 8, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Conquistas Operacionais:', margin + kpiWidth + 45, kpiSectionY + 30);

    // Terceiro círculo - Volume de Negociação (mais elegante)
    const circle3X = margin + kpiWidth + 100;
    const circle3Y = kpiSectionY + 70;
    const circle3Radius = 35;
    
    // Círculo com borda e sombra sutil
    doc.setFillColor('#e0f2fe'); // blue-50
    doc.circle(circle3X, circle3Y, circle3Radius, 'F');
    
    // Borda do círculo
    doc.setDrawColor('#0ea5e9'); // sky-500
    doc.setLineWidth(2);
    doc.circle(circle3X, circle3Y, circle3Radius, 'S');
    
    // Ícone no centro
    doc.setTextColor('#0ea5e9'); // sky-500
    doc.setFontSize(18);
    doc.text('📊', circle3X - 6, circle3Y + 4);
    
    // Percentual ao lado
    const volumePercent = Math.min((metrics.totalVolume / 1000) * 100, 100);
    doc.setTextColor('#3b82f6'); // blue-500
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${volumePercent.toFixed(0)}%`, circle3X + 60, circle3Y + 8);

    // Texto descritivo
    doc.setTextColor('#1f2937'); // gray-800
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Volume Total:', circle3X - 15, circle3Y + 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${metrics.totalVolume.toFixed(0)} pontos`, circle3X - 15, circle3Y + 70);
    doc.text(`Máxima variação: ${metrics.maxChange.toFixed(1)}%`, circle3X - 15, circle3Y + 85);

    // Quarto círculo - Estabilidade (mais elegante)
    const circle4X = margin + kpiWidth + 100;
    const circle4Y = kpiSectionY + 130;
    const circle4Radius = 30;
    
    // Círculo com borda e sombra sutil
    doc.setFillColor('#e0f2fe'); // blue-50
    doc.circle(circle4X, circle4Y, circle4Radius, 'F');
    
    // Borda do círculo
    doc.setDrawColor('#0ea5e9'); // sky-500
    doc.setLineWidth(2);
    doc.circle(circle4X, circle4Y, circle4Radius, 'S');
    
    // Ícone no centro
    doc.setTextColor('#0ea5e9'); // sky-500
    doc.setFontSize(16);
    doc.text('⚖️', circle4X - 5, circle4Y + 3);
    
    // Percentual ao lado
    const stabilityColor = metrics.stabilityIndex >= 70 ? '#16a34a' : 
                          metrics.stabilityIndex >= 50 ? '#f59e0b' : 
                          '#dc2626';
    doc.setTextColor(stabilityColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metrics.stabilityIndex.toFixed(0)}%`, circle4X + 50, circle4Y + 5);

    // Texto descritivo
    doc.setTextColor('#1f2937'); // gray-800
        doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Estabilidade:', circle4X - 12, circle4Y + 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Volatilidade: ${metrics.volatility.toFixed(2)}%`, circle4X - 12, circle4Y + 60);
    doc.text(`Mínima variação: ${metrics.minChange.toFixed(1)}%`, circle4X - 12, circle4Y + 75);

    y = kpiSectionY + 200;

    // --- INICIATIVAS ESTRATÉGICAS REFINADAS (Seguindo exatamente o design de referência) ---
    doc.setFillColor('#16a34a'); // green-600
    doc.roundedRect(margin, y, pageW - (margin * 2), 40, 8, 8, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Iniciativas Estratégicas e Impacto Social:', margin + 25, y + 28);
    y += 50;

    // Tabela de iniciativas com design mais elegante (exatamente como no design de referência)
    const initiatives = [
        ['Expansão de Mercado', `${metrics.totalAssets} ativos monitorados`],
        ['Inovação', `${metrics.positiveChanges} ativos com performance positiva`],
        ['Transformação Digital', `Volatilidade reduzida para ${metrics.volatility.toFixed(1)}%`],
        ['Sustentabilidade Ambiental', `Diversificação de ${metrics.diversificationRate.toFixed(0)}%`],
        ['Engajamento Comunitário', `Suporte a ${Math.max(1, Math.floor(metrics.totalAssets / 2))} comunidades`]
    ];

    // Cabeçalho da tabela mais elegante
    doc.setFillColor('#f1f5f9'); // slate-100
    doc.roundedRect(margin, y, pageW - (margin * 2), 35, 8, 8, 'F');
    
    doc.setTextColor('#1e40af'); // blue-800
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Iniciativa', margin + 25, y + 25);
    doc.text('Impacto/Realização', margin + (pageW - margin * 2) / 2, y + 25);
    y += 40;

    // Linhas da tabela com design mais sofisticado
    initiatives.forEach((initiative, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'; // white ou gray-50
        
        doc.setFillColor(bgColor);
        doc.roundedRect(margin, y - 12, pageW - (margin * 2), 35, 8, 8, 'F');
        
        // Borda sutil nas linhas
        doc.setDrawColor('#e2e8f0'); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, y - 12, pageW - margin, y - 12);
        
        doc.setTextColor('#1f2937'); // gray-800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(initiative[0], margin + 25, y + 12);
        doc.text(initiative[1], margin + (pageW - margin * 2) / 2, y + 12);
        y += 35;
    });

    y += 40;

    // --- RODAPÉ ELEGANTE E LIMPO ---
    // Linha separadora sutil
    doc.setDrawColor('#e5e7eb'); // gray-200
    doc.setLineWidth(1);
    doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
    
    // Texto do rodapé
    doc.setTextColor('#6b7280'); // gray-500
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('UCS Index Corporation | Relatório Executivo | ' + reportDate, pageW / 2, pageH - 20, { align: 'center' });

    return doc;
};


export const generatePdf = (
    reportType: string, 
    data: DashboardPdfData, 
    template: PdfTemplate = 'complete',
    themeName: string = 'corporate'
): string => {
    try {
        let doc: jsPDF;
    
    // Roteia para o gerador de PDF correto baseado no template
    switch (template) {
        case 'simple':
                doc = generateSimpleDashboardPdf(data, themeName);
            break;
        case 'executive':
                doc = generateExecutiveDashboardPdf(data, themeName);
            break;
        case 'complete':
        default:
                doc = generateCompleteDashboardPdf(data, themeName);
            break;
    }
    
    // Sempre retorna a string de dados, que é compatível com o iframe
    return doc.output('datauristring');
    } catch (error) {
        console.error('Erro na geração do PDF:', error);
        throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
};

// Função para obter temas disponíveis
export const getAvailableThemes = (): string[] => {
    return Object.keys(themes);
};

// Função para obter informações de um tema
export const getThemeInfo = (themeName: string): PdfTheme | null => {
    return themes[themeName] || null;
};

// Função para criar tema personalizado
export const createCustomTheme = (themeName: string, theme: Partial<PdfTheme>): boolean => {
    if (themes[themeName]) {
        return false; // Tema já existe
    }
    
    const defaultTheme = themes.corporate;
    themes[themeName] = {
        primary: theme.primary || defaultTheme.primary,
        secondary: theme.secondary || defaultTheme.secondary,
        accent: theme.accent || defaultTheme.accent,
        background: theme.background || defaultTheme.background,
        text: theme.text || defaultTheme.text,
        success: theme.success || defaultTheme.success,
        warning: theme.warning || defaultTheme.warning,
        danger: theme.danger || defaultTheme.danger,
        light: theme.light || defaultTheme.light
    };
    
    return true;
};

// Função para obter estatísticas do PDF
export const getPdfStats = (data: DashboardPdfData): {
    totalAssets: number;
    totalPages: number;
    estimatedSize: number;
    generationTime: number;
} => {
    const metrics = calculateMetrics(data);
    const totalAssets = metrics.totalAssets;
    
    // Estimativa de páginas baseada no template
    const estimatedPages = totalAssets > 20 ? Math.ceil(totalAssets / 15) + 1 : 2;
    
    // Estimativa de tamanho em KB
    const estimatedSize = estimatedPages * 150; // ~150KB por página
    
    return {
        totalAssets,
        totalPages: estimatedPages,
        estimatedSize,
        generationTime: Date.now()
    };
};
