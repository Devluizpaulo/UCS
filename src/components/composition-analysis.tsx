'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompositionDataWithComponents } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, PieChart as PieChartIcon, AlertTriangle, RefreshCw, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicCompositionChart } from '@/components/charts/dynamic-composition-chart';
import { ChartTypeSelector, ChartType } from '@/components/charts/chart-type-selector';
import { HistoricalCompositionTable } from '@/components/historical-composition-table';
import { getComponentColor } from '@/lib/colors';

interface CompositionAnalysisProps {
  targetDate: Date;
}

// Mapeamento fixo dos componentes - nomes sempre corretos
const FIXED_COMPONENT_NAMES: Record<string, string> = {
  vus: 'VUS (Valor de Uso do Solo)',
  vmad: 'VMAD (Valor da Madeira)',
  carbono_crs: 'Carbono CRS',
  agua_crs: 'Agua CRS',
  crs_total: 'CRS (Custo de Resp. Socioambiental)'
};

// Função para obter nome fixo do componente
const getFixedComponentName = (componentId: string): string => {
  return FIXED_COMPONENT_NAMES[componentId] || componentId;
};

// Função para formatar porcentagens de forma consistente
const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export function CompositionAnalysis({ targetDate }: CompositionAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('pie');

  const exportChartToPDF = async () => {
    try {
      const orientation = chartType === 'bar' ? 'landscape' : 'portrait';
      const doc = new jsPDF(orientation as any, 'mm', 'a4');
      const pageWidth = (doc as any).internal.pageSize.getWidth();
      const pageHeight = (doc as any).internal.pageSize.getHeight();
      const margin = 15;
      const gapS = 6, gapM = 10, gapL = 16;

      // Marca d'água (logo ao fundo)
      try {
        const res = await fetch('/image/BMV.png');
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const wmWidth = pageWidth * 0.6;
          const wmHeight = wmWidth * 0.45; // proporção aproximada
          const wmX = (pageWidth - wmWidth) / 2;
          const wmY = (pageHeight - wmHeight) / 2;
          if ((doc as any).setGState && (doc as any).GState) {
            const gs = new (doc as any).GState({ opacity: 0.04 });
            (doc as any).setGState(gs);
            doc.addImage(dataUrl, 'PNG', wmX, wmY, wmWidth, wmHeight);
            const gsReset = new (doc as any).GState({ opacity: 1 });
            (doc as any).setGState(gsReset);
          } else {
            // Fallback: ainda adiciona, mas manter tamanho menor para reduzir impacto
            doc.addImage(dataUrl, 'PNG', wmX, wmY, wmWidth, wmHeight);
          }
        }
      } catch {}

      // Metadados
      (doc as any).setProperties?.({
        title: 'Análise de Composição - Valor de Uso do Solo',
        subject: 'Exportação do painel de composição',
        creator: 'UCS Index',
      });

      // Logotipo (opcional)
      try {
        const res = await fetch('/image/BMV.png');
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const logoW = 22;
          const logoH = 22;
          doc.addImage(dataUrl, 'PNG', pageWidth - margin - logoW, 14, logoW, logoH);
        }
      } catch {}
      
      // Título principal (envolver texto para não colidir com o logo à direita)
      const TITLE_TEXT = 'Análise de Composição – Valor de Uso do Solo';
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const logoHeaderWidth = 22; // mesmo tamanho do logo no topo
      const maxTextWidth = pageWidth - margin * 2 - (logoHeaderWidth + 6);
      const titleLines = (doc as any).splitTextToSize
        ? (doc as any).splitTextToSize(TITLE_TEXT, maxTextWidth)
        : [TITLE_TEXT];
      doc.text(titleLines, 20, 30);

      const afterTitleY = 30 + (titleLines.length - 1) * 8;
      
      // Data (esquerda) e empresa (direita)
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      const dateY = afterTitleY + 14;
      doc.text(`Data: ${data?.data || 'N/A'}`, 20, dateY);
      doc.setFont('helvetica', 'normal');
      doc.text('BMV', pageWidth - margin, dateY, { align: 'right' } as any);

      // Divisor sutil abaixo do cabeçalho
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      const dividerY = dateY + 4;
      doc.line(margin, dividerY, pageWidth - margin, dividerY);

      // Cartão do Valor Total
      const totalBoxY = dividerY + gapS;
      doc.setFillColor(244, 246, 248);
      doc.setDrawColor(244, 246, 248);
      doc.roundedRect(margin, totalBoxY, pageWidth - margin * 2, 12, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text(`Valor Total: ${formatCurrency(data?.valor || 0, 'BRL')}`, margin + 6, totalBoxY + 8);
      doc.setTextColor(0, 0, 0);
      
      // Y inicial do gráfico baseado no cabeçalho calculado
      const chartStartY = totalBoxY + gapL;
      
      // Capturar o gráfico
      const chartElement = document.getElementById('composition-chart');
      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 3,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const usableWidth = pageWidth - margin * 2;
        let imgWidth = usableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxChartHeight = pageHeight * 0.26;
        if (imgHeight > maxChartHeight) {
          imgHeight = maxChartHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }
        
        // Adicionar subtítulo e cartão do gráfico
        const chartY = chartStartY;
        const chartX = (pageWidth - imgWidth) / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(60, 60, 60);
        doc.text('Gráfico de Composição', margin, chartY - 6);
        // Cartão de fundo do gráfico
        doc.setFillColor(248, 249, 251);
        doc.setDrawColor(235, 238, 240);
        doc.roundedRect(margin, chartY - 4, pageWidth - margin * 2, imgHeight + 8, 2, 2, 'FD');
        // Gráfico
        doc.addImage(imgData, 'PNG', chartX, chartY, imgWidth, imgHeight);

        // Armazenar posição base para tabela após o gráfico
        (doc as any).__tableStartY = chartY + imgHeight + gapL;
      }
      
      // Preparar dados da tabela de valores detalhados
      const tableRows: string[][] = [];
      const rowMeta: { id: string; isSub: boolean }[] = [];
      
      console.log('🔍 [PDF Export] Processing tableData:', tableData);
      
      // Verificar se temos dados válidos
      if (!tableData || tableData.length === 0) {
        console.error('❌ [PDF Export] No tableData available');
        return;
      }
      
      // Validar estrutura dos dados
      const validTableData = tableData.filter(item => {
        const isValid = item && 
                       item.id && 
                       typeof item.value === 'number' && 
                       typeof item.percentage === 'number' &&
                       !isNaN(item.value) &&
                       !isNaN(item.percentage);
        
        if (!isValid) {
          console.warn('⚠️ [PDF Export] Invalid tableData item:', item);
        }
        
        return isValid;
      });
      
      console.log('🔍 [PDF Export] Valid tableData items:', validTableData.length);
      
      // Adicionar componentes principais (não sub-componentes)
      const mainComponents = validTableData.filter(item => !item.isSub);
      console.log('🔍 [PDF Export] Main components:', mainComponents);
      
      mainComponents.forEach(item => {
        // Validar dados antes de adicionar
        if (item.id && typeof item.value === 'number' && typeof item.percentage === 'number') {
          // Usar nome fixo do componente baseado no ID
          const fixedName = getFixedComponentName(item.id);
          tableRows.push([
            fixedName,
            formatCurrency(item.value, 'BRL'),
            formatPercentage(item.percentage)
          ]);
          rowMeta.push({ id: item.id, isSub: false });
        } else {
          console.warn('⚠️ [PDF Export] Invalid item data:', item);
        }
      });

      // Adicionar sub-componentes do CRS (apenas os que têm parent)
      const crsSubItems = validTableData.filter(sub => sub.isSub && sub.parent === 'crs_total');
      console.log('🔍 [PDF Export] CRS sub-items:', crsSubItems);
      
      crsSubItems.forEach(subItem => {
        // Validar dados antes de adicionar
        if (subItem.id && typeof subItem.value === 'number' && typeof subItem.percentage === 'number') {
          // Usar nome fixo do componente baseado no ID
          const fixedName = getFixedComponentName(subItem.id);
          tableRows.push([
            `└─ ${fixedName}`,
            formatCurrency(subItem.value, 'BRL'),
            formatPercentage(subItem.percentage)
          ]);
          rowMeta.push({ id: subItem.id, isSub: true });
        } else {
          console.warn('⚠️ [PDF Export] Invalid sub-item data:', subItem);
        }
      });

      // Adicionar linha do total
      if (data?.valor && typeof data.valor === 'number') {
        tableRows.push([
          'Total',
          formatCurrency(data.valor, 'BRL'),
          '100.00%'
        ]);
        rowMeta.push({ id: 'total', isSub: false });
      }

      console.log('🔍 [PDF Export] Final table rows:', tableRows);

      // Configurações da tabela
      // Título da tabela
      const tableTitleY = ((doc as any).__tableStartY || chartStartY + 100) - gapS;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(40, 40, 40);
      doc.text('Valores detalhados', margin, tableTitleY);

      const compact = true; // garantir layout mais compacto e executivo
      // Helper para converter HEX -> RGB
      const hexToRgb = (hex: string): [number, number, number] => {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean.length === 3 ? clean.split('').map(c=>c+c).join('') : clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
      };

      const tableConfig = {
        head: [['Componente', 'Valor', '%']],
        body: tableRows,
        startY: (doc as any).__tableStartY || chartStartY + 100,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 1.8,
          overflow: 'linebreak',
          halign: 'left',
          lineColor: [235, 238, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [247, 249, 251],
          textColor: [80, 90, 100],
          fontStyle: 'bold',
          lineColor: [220, 224, 228],
          lineWidth: 0.2
        },
        alternateRowStyles: {
          fillColor: [252, 252, 253]
        },
        columnStyles: {
          0: { halign: 'left' },   // Componente
          1: { halign: 'right' },  // Valor
          2: { halign: 'right' }   // %
        },
        didDrawCell: (data: any) => {
          // Destacar linha do total
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fillColor = [240, 244, 248];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.lineTopWidth = 0.4;
            data.cell.styles.lineTopColor = [200, 204, 208];
          }
          
          // Destacar linha do CRS (componente principal)
          if (data.row.raw[0] && data.row.raw[0].includes('CRS') && !data.row.raw[0].includes('└─')) {
            data.cell.styles.fillColor = [255, 248, 220]; // Amarelo claro
          }

          // Embelezamentos customizados
          if (data.section === 'body') {
            const meta = rowMeta[data.row.index] || { id: '', isSub: false };

            // Coluna do componente: bolinha colorida para principais; guia sutil para sub-itens; borda âmbar para CRS total
            if (data.column.index === 0) {
              const [x, y, w, h] = [data.cell.x, data.cell.y, data.cell.width, data.cell.height];
              const cy = y + h / 2;
              if (meta.isSub) {
                // Guia sutil à esquerda (âmbar)
                (doc as any).setDrawColor(255, 193, 7);
                (doc as any).setLineWidth(0.5);
                (doc as any).line(x + 2, y + 2, x + 2, y + h - 2);
              } else if (meta.id === 'crs_total') {
                // Borda lateral âmbar na linha do CRS total
                (doc as any).setDrawColor(255, 193, 7);
                (doc as any).setLineWidth(1);
                // linha à esquerda do bloco da tabela
                (doc as any).line(x + 1, y + 1, x + 1, y + h - 1);
              } else if (meta.id !== 'total') {
                // Bolinha colorida
                try {
                  const colorHex = getComponentColor(meta.id) || '#64748B';
                  const [r, g, b] = hexToRgb(colorHex);
                  (doc as any).setFillColor(r, g, b);
                } catch {
                  (doc as any).setFillColor(100, 116, 139);
                }
                ;(doc as any).circle(x + 4.8, cy, 2.1, 'F');
              }
            }

            // Coluna de porcentagem: badge (pill)
            if (data.column.index === 2) {
              const text = String((data.cell.text && data.cell.text[0]) || '');
              const [x, y, w, h] = [data.cell.x, data.cell.y, data.cell.width, data.cell.height];
              const paddingX = 2.2;
              const paddingY = 1.2;
              (doc as any).setFontSize(8.5);
              const tw = (doc as any).getTextWidth(text);
              const badgeW = tw + paddingX * 2 + 1;
              const badgeH = 6;
              const bx = x + w - badgeW - 2;
              const by = y + (h - badgeH) / 2;

              // Cores do badge
              let fill: [number, number, number] = [233, 236, 239]; // cinza claro
              let textCol: [number, number, number] = [60, 60, 60];
              if (meta.id === 'total' && data.row.index === tableRows.length - 1) {
                fill = [26, 32, 44];
                textCol = [255, 255, 255];
              } else if (meta.isSub) {
                // âmbar mais próximo do mock (#FFE8B0 aproximadamente)
                fill = [255, 232, 176];
                textCol = [120, 72, 0];
              }

              (doc as any).setFillColor(...fill);
              (doc as any).setDrawColor(235, 238, 240);
              (doc as any).roundedRect(bx, by, badgeW, badgeH, 2, 2, 'F');
              (doc as any).setTextColor(...textCol);
              (doc as any).text(text, bx + badgeW / 2, by + badgeH / 2 + 2, { align: 'center' } as any);
              (doc as any).setTextColor(0, 0, 0);
            }
          }
        }
      };

      // Gerar tabela
      (doc as any).autoTable(tableConfig);
      
      // Adicionar informações adicionais
      let finalY = (doc as any).lastAutoTable.finalY || 150;
      // Se o rodapé não couber na página, quebrar página
      const footerBlockHeight = 26 + 35; // bloco + separador e notas
      if (finalY + footerBlockHeight > pageHeight - margin) {
        (doc as any).addPage();
        finalY = margin + 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('* Gráfico gerado automaticamente a partir dos dados da composição', 20, finalY + 10);
      doc.text('* Valores em Reais (BRL) — Porcentagens com 2 casas decimais', 20, finalY + 18);
      doc.text(`* Exportado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, finalY + 26);

      // Separador
      doc.setDrawColor(200, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, finalY + 35, pageWidth - 20, finalY + 35);

      // Bloco de confidencialidade no rodapé
      doc.setFillColor(255, 235, 238);
      doc.setDrawColor(244, 67, 54);
      doc.roundedRect(margin, finalY + 40, pageWidth - margin * 2, 26, 2, 2, 'FD');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('CONFIDENCIAL', margin + 4, finalY + 48);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Este documento contém informações confidenciais e proprietárias.', margin + 4, finalY + 56);
      doc.text('É proibida a reprodução, distribuição ou divulgação sem autorização expressa.', margin + 4, finalY + 62);

      // Numeração de páginas no rodapé
      const pageCount = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        (doc as any).setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' } as any);
      }

      // Salvar PDF
      doc.save(`composicao_grafico_${format(targetDate, 'yyyy-MM-dd')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 [CompositionAnalysis] Fetching composition data for ${targetDate.toISOString().split('T')[0]}`);
      
      const result = await getCompositionDataWithComponents(targetDate);
      
      if (!result) {
        console.log(`❌ [CompositionAnalysis] No composition data found`);
        setError('Nenhum dado de composição encontrado');
      } else {
        console.log(`✅ [CompositionAnalysis] Found composition data:`, {
          data: result.data,
          hasValor: !!result.valor,
          hasComponentes: !!result.componentes,
          valor: result.valor,
          componentes: result.componentes
        });
      }
      
        setData(result);
      } catch (error) {
        console.error("❌ [CompositionAnalysis] Failed to fetch composition data:", error);
      setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [targetDate]);

  const { chartData, tableData, mainAssetData } = useMemo(() => {
    if (!data) {
      return { chartData: [], tableData: [], mainAssetData: null };
    }

    console.log(`🔄 [CompositionAnalysis] Processing data:`, {
      hasValoresOriginais: !!data.valores_originais,
      hasPorcentagens: !!data.porcentagens,
      hasValor: !!data.valor,
      valores_originais: data.valores_originais,
      porcentagens: data.porcentagens,
      valor: data.valor
    });

    // Verificar se temos a nova estrutura de dados
    if (!data.valores_originais || !data.porcentagens || !data.valor) {
      console.log(`⚠️ [CompositionAnalysis] Missing valores_originais, porcentagens or valor in data`);
      return { chartData: [], tableData: [], mainAssetData: null };
    }

    const valores = data.valores_originais;
    const porcentagens = data.porcentagens;
    const valorTotal = data.valor;

    // Extrair valores e porcentagens
    const vus = valores.vus || 0;
    const vmad = valores.vmad || 0;
    const carbono_crs = valores.carbono_crs || 0;
    const agua_crs = valores.agua_crs || 0;

    const vus_pct = parseFloat(porcentagens.vus_p?.replace('%', '') || '0');
    const vmad_pct = parseFloat(porcentagens.vmad_p?.replace('%', '') || '0');
    const carbono_crs_pct = parseFloat(porcentagens.carbono_crs_p?.replace('%', '') || '0');
    const agua_crs_pct = parseFloat(porcentagens.agua_crs_p?.replace('%', '') || '0');

    console.log(`📊 [CompositionAnalysis] Processed components:`, {
      vus: { value: vus, percentage: vus_pct },
      vmad: { value: vmad, percentage: vmad_pct },
      carbono_crs: { value: carbono_crs, percentage: carbono_crs_pct },
      agua_crs: { value: agua_crs, percentage: agua_crs_pct },
      total: vus + vmad + carbono_crs + agua_crs,
      expectedTotal: valorTotal
    });

    const crsTotalValue = carbono_crs + agua_crs;
    const crsTotalPct = carbono_crs_pct + agua_crs_pct;
    
    const chartItems = [
      { id: 'vus', name: FIXED_COMPONENT_NAMES.vus, value: vus },
      { id: 'vmad', name: FIXED_COMPONENT_NAMES.vmad, value: vmad },
      { id: 'crs_total', name: FIXED_COMPONENT_NAMES.crs_total, value: crsTotalValue }
    ].filter(item => item.value > 0);

    const tableItems = [
      { id: 'vus', name: FIXED_COMPONENT_NAMES.vus, value: vus, percentage: vus_pct, isSub: false },
      { id: 'vmad', name: FIXED_COMPONENT_NAMES.vmad, value: vmad, percentage: vmad_pct, isSub: false },
      { id: 'crs_total', name: FIXED_COMPONENT_NAMES.crs_total, value: crsTotalValue, percentage: crsTotalPct, isSub: false },
      { id: 'carbono_crs', name: FIXED_COMPONENT_NAMES.carbono_crs, value: carbono_crs, percentage: carbono_crs_pct, isSub: true, parent: 'crs_total' },
      { id: 'agua_crs', name: FIXED_COMPONENT_NAMES.agua_crs, value: agua_crs, percentage: agua_crs_pct, isSub: true, parent: 'crs_total' },
    ].filter(item => item.value > 0);
    
    const mainAsset = {
        id: 'valor_uso_solo',
        name: 'Valor de Uso do Solo',
        price: valorTotal,
        change: data.variacao_pct || 0,
        absoluteChange: data.variacao_abs || 0,
        currency: 'BRL',
        category: 'index',
        description: 'Índice de composição do uso do solo.',
        unit: 'Pontos',
        lastUpdated: data.data,
    };

    console.log(`✅ [CompositionAnalysis] Final result:`, {
      chartItems: chartItems.length,
      tableItems: tableItems.length,
      hasMainAsset: !!mainAsset,
      totalValue: valorTotal
    });

    return { chartData: chartItems, tableData: tableItems, mainAssetData: mainAsset };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Dados Indisponíveis
          </CardTitle>
          <CardDescription>
            Não foi possível carregar os dados de composição para a data selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72 text-muted-foreground">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
            <div className="space-y-2">
              <p>{error || `Nenhuma composição encontrada para ${format(targetDate, 'dd/MM/yyyy')}.`}</p>
              <p className="text-sm">
                Tente navegar para datas anteriores usando os controles acima.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => {
                  const yesterday = new Date(targetDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  window.location.href = `/analysis/composition?date=${yesterday.toISOString().split('T')[0]}`;
                }} 
                variant="default"
              >
                Data Anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de tipos de gráfico */}
      <ChartTypeSelector 
        selectedType={chartType} 
        onTypeChange={setChartType} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <PieChartIcon className="h-6 w-6"/>
                  </div>
                       Composição do Índice "Valor de Uso do Solo"
                    </CardTitle>
                <CardDescription className="text-blue-100 mt-2 text-lg">
                  Distribuição dos componentes para <span className="font-bold text-white">{formatCurrency(data.valor, 'BRL')}</span> em <span className="font-semibold">{data.data}</span>
                    </CardDescription>
                </div>
              <div className="flex gap-2">
                <Button 
                  onClick={exportChartToPDF} 
                      variant="outline"
                      size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[380px] h-[460px] md:h-[520px] lg:h-[560px] p-6 bg-gradient-to-br from-white to-gray-50/50" id="composition-chart">
            <DynamicCompositionChart data={chartData} chartType={chartType} />
          </CardContent>
        </Card>

      <div className="lg:col-span-2">
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full" />
              Valores Detalhados
            </CardTitle>
            <CardDescription className="text-gray-600">
              Análise tabular de cada componente do índice
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg" id="detailed-values-table">
            <Table>
              <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-4">Componente</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4">Valor</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {tableData.filter(item => !item.isSub).map((item, index) => (
                  <React.Fragment key={item.id}>
                      <TableRow className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-green-50/30 transition-all duration-200 ${item.id === 'crs_total' ? 'font-bold bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-l-4 border-amber-400' : ''}`}>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg border-2 border-white" 
                              style={{ 
                                backgroundColor: getComponentColor(item.id)
                              }} 
                            />
                            <span className="font-medium text-gray-800">{getFixedComponentName(item.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-900 font-semibold py-4">
                          {formatCurrency(item.value, 'BRL')}
                      </TableCell>
                        <TableCell className="text-right font-mono text-gray-900 font-semibold py-4">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {formatPercentage(item.percentage)}
                          </span>
                        </TableCell>
                      </TableRow>
                      {item.id === 'crs_total' && tableData.filter(sub => 'parent' in sub && sub.parent === 'crs_total').map(subItem => (
                        <TableRow key={subItem.id} className="hover:bg-gradient-to-r hover:from-amber-50/20 hover:to-orange-50/20 transition-all duration-200">
                          <TableCell className="pl-12 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-600 font-bold">└─</span>
                              <span className="text-gray-700">{getFixedComponentName(subItem.id)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-700 py-3">
                            {formatCurrency(subItem.value, 'BRL')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-700 py-3">
                            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                              {formatPercentage(subItem.percentage)}
                            </span>
                          </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                  <TableRow className="font-bold bg-gradient-to-r from-gray-100 to-gray-200 border-t-4 border-gray-300">
                    <TableCell className="py-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full" />
                        Total
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-900 font-bold py-4 text-lg">
                      {formatCurrency(data.valor, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-900 font-bold py-4 text-lg">
                      <span className="px-3 py-1 rounded-full bg-gray-800 text-white">
                        100.00%
                      </span>
                    </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      
      {/* Tabela Histórica */}
      <HistoricalCompositionTable className="mt-8" />
    </div>
  );
}