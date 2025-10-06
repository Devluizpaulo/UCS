
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

const generateSimpleDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { mainIndex, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.text('Relatório de Cotações Simplificado', 15, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${formattedDate}`, 15, 30);

    if (mainIndex) {
        doc.autoTable({
            startY: 40,
            head: [['Índice Principal', 'Valor']],
            body: [[mainIndex.name, formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id)]],
            theme: 'striped',
        });
    }

    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Ativo', 'Preço', 'Variação']],
        body: otherAssets.map(asset => [
            asset.name,
            formatCurrency(asset.price, asset.currency, asset.id),
            `${asset.change.toFixed(2)}%`
        ]),
        theme: 'grid',
    });

    return doc;
};

const generateCompleteDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const generationDate = format(new Date(), "dd/MM/yyyy HH:mm");
    let finalY = 20;

    // --- Cabeçalho ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Painel de Cotações', 15, finalY);
    finalY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dados para: ${formattedDate}`, 15, finalY);
    finalY += 15;

    // --- Função para gerar seção ---
    const generateSection = (title: string, assets: CommodityPriceData[]) => {
      if (!assets || assets.length === 0) return;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, finalY);
      finalY += 8;

      const head = [['Ativo', 'Último Preço', 'Variação (24h)']];
      const body = assets.map(asset => {
        const changeText = `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`;
        return [asset.name, formatCurrency(asset.price, asset.currency, asset.id), changeText];
      });

      doc.autoTable({
        startY: finalY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold' },
        didParseCell: (data: any) => {
           if (data.column.index === 2 && data.section === 'body') {
              const cellValue = data.cell.raw as string;
              if(cellValue.startsWith('+')) {
                  data.cell.styles.textColor = [39, 174, 96]; // Verde
              } else if (cellValue.startsWith('-')) {
                  data.cell.styles.textColor = [192, 57, 43]; // Vermelho
              }
           }
        }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    };
    
    // --- Gera seções ---
    if(mainIndex) generateSection('Índice Principal', [mainIndex]);
    generateSection('Índices Secundários', secondaryIndices);
    generateSection('Moedas', currencies);
    generateSection('Commodities e Outros Ativos', otherAssets);
    
    // --- Rodapé ---
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} | Relatório gerado em ${generationDate} | UCS Index`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return doc;
};

const generateExecutiveDashboardPdf = (data: DashboardPdfData): jsPDF => {
    const doc = new jsPDF('p', 'pt') as jsPDFWithAutoTable;
    const { mainIndex, secondaryIndices, currencies, otherAssets, targetDate } = data;
    const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const shortDate = format(targetDate, "MMMM dd, yyyy", { locale: ptBR });

    const primaryColor = '#16a34a'; // green-600
    const secondaryColor = '#0f172a'; // slate-900
    const mutedColor = '#64748b'; // slate-500
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 60;

    // --- CABEÇALHO ---
    doc.setTextColor(secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('UCS INDEX', margin, y);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin + 60, y - 4, pageW - margin, y - 4);
    y += 40;

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Executivo de', margin, y);
    y += 30;
    doc.setTextColor(primaryColor);
    doc.text('Ativos e Índices', margin, y);
    
    const boxWidth = 180;
    const boxHeight = 40;
    const boxX = pageW - margin - boxWidth;
    const foldSize = 10;
    const titleY = 100;

    doc.setFillColor(primaryColor);
    doc.triangle(boxX, titleY, boxX + foldSize, titleY - foldSize, boxX, titleY - foldSize, 'F');
    doc.rect(boxX, titleY - boxHeight, boxWidth, boxHeight, 'F');

    doc.setTextColor('#FFFFFF');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Destaques do Painel', boxX + 10, titleY - 25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(formattedDate, boxX + 10, titleY - 13);

    y = titleY + 60;

    // --- BLOCO DE KPIs ---
    if (mainIndex) {
        doc.setFillColor(secondaryColor);
        doc.roundedRect(margin, y, pageW - (margin * 2), 25, 5, 5, 'F');
        doc.setTextColor('#FFFFFF');
        doc.setFontSize(11);
        doc.text('Indicador Principal de Performance: ' + mainIndex.name, margin + 10, y + 16);
        y += 25;

        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, pageW - (margin * 2), 70, 5, 5, 'S');
        
        const kpiY = y + 30;
        doc.setFontSize(26);
        doc.setTextColor(secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(mainIndex.price, mainIndex.currency, mainIndex.id), margin + 20, kpiY);
        
        doc.setFontSize(10);
        const changeColor = mainIndex.change >= 0 ? '#16a34a' : '#dc2626';
        doc.setTextColor(changeColor);
        doc.text(`Variação (24h): ${mainIndex.change.toFixed(2)}%`, margin + 20, kpiY + 18);
        
        doc.setFontSize(9);
        doc.setTextColor(mutedColor);
        doc.text(`Descrição: ${mainIndex.description}`, margin + 20, kpiY + 30);
    }
    
    y += (mainIndex ? 70 : 0) + 30;

    // --- TABELAS ---
    const generateTable = (title: string, assets: CommodityPriceData[]) => {
      if (!assets || assets.length === 0) return;
      
      doc.setFillColor(primaryColor);
      doc.roundedRect(margin, y, pageW - (margin * 2), 22, 5, 5, 'F');
      doc.setTextColor('#FFFFFF');
      doc.setFontSize(11);
      doc.text(title, margin + 10, y + 15);
      y += 22;

      doc.autoTable({
        startY: y,
        head: [['Ativo', 'Último Preço', 'Variação (24h)']],
        body: assets.map(asset => [
            asset.name,
            formatCurrency(asset.price, asset.currency, asset.id),
            `${asset.change.toFixed(2)}%`
        ]),
        theme: 'striped',
        margin: { left: margin, right: margin },
        headStyles: { fillColor: secondaryColor },
        styles: { cellPadding: 8, fontSize: 9 },
        didDrawPage: (data: any) => { y = data.cursor?.y || 0; }
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    };

    generateTable('Índices Secundários', secondaryIndices);
    generateTable('Moedas', currencies);
    generateTable('Outros Ativos e Commodities', otherAssets);

    return doc;
};


export const generatePdf = (reportType: string, data: any, template: PdfTemplate = 'complete'): string => {
    let doc;
    
    // Roteia para o gerador de PDF correto baseado no template
    switch (template) {
        case 'simple':
            doc = generateSimpleDashboardPdf(data as DashboardPdfData);
            break;
        case 'executive':
            doc = generateExecutiveDashboardPdf(data as DashboardPdfData);
            break;
        case 'complete':
        default:
            doc = generateCompleteDashboardPdf(data as DashboardPdfData);
            break;
    }
    
    // Sempre retorna a string de dados, que é compatível com o iframe
    return doc.output('datauristring');
};
