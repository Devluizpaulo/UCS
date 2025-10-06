
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

const generateDashboardPdf = (data: DashboardPdfData): jsPDF => {
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
        didParseCell: (data) => {
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


export const generatePdf = (reportType: string, data: any, template: PdfTemplate = 'complete'): string => {
    let doc;
    switch (reportType) {
        case 'dashboard':
            doc = generateDashboardPdf(data as DashboardPdfData);
            break;
        // Adicionar outros tipos de relatório aqui
        default:
            doc = new jsPDF();
            doc.text("Tipo de relatório não suportado.", 10, 10);
    }
    
    return doc.output('datauristring');
};
