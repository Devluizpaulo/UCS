
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Download, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBrazilHolidays } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ASSET_DEPENDENCIES, type AssetDependency } from '@/lib/dependency-service';


interface ComparisonData {
  assetId: string;
  assetName: string;
  currentValue: number;
  compareValue: number;
  absoluteChange: number;
  percentageChange: number;
  currency: string;
  type: AssetDependency['calculationType'];
}

interface DateComparisonProps {
  currentDate: Date;
  currentData: CommodityPriceData[];
}

function getTrendIcon(percentageChange: number) {
  if (percentageChange > 0.01) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else if (percentageChange < -0.01) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function getTrendBadge(percentageChange: number) {
  if (percentageChange > 5) {
    return <Badge variant="default" className="bg-green-100 text-green-800">Alta Significativa</Badge>;
  } else if (percentageChange > 0.01) {
    return <Badge variant="outline" className="text-green-700">Alta</Badge>;
  } else if (percentageChange < -5) {
    return <Badge variant="destructive">Queda Significativa</Badge>;
  } else if (percentageChange < -0.01) {
    return <Badge variant="outline" className="text-red-700">Queda</Badge>;
  } else {
    return <Badge variant="secondary">Estável</Badge>;
  }
}

// Estende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export function DateComparison({ currentDate, currentData }: DateComparisonProps) {
  const BR_HOLIDAYS_2025 = getBrazilHolidays(2025)
  const [compareDate, setCompareDate] = useState<Date | undefined>();
  const [compareData, setCompareData] = useState<CommodityPriceData[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const comparisonContentRef = useRef<HTMLDivElement>(null);


  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    setCompareDate(date);
    setIsCalendarOpen(false);
    setIsLoading(true);

    try {
      const data = await getCommodityPricesByDate(date);
      setCompareData(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setCompareData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (compareData.length > 0 && currentData.length > 0) {
      const results: ComparisonData[] = [];
      
      const compareMap = new Map(compareData.map(item => [item.id, item]));
      
      currentData.forEach(currentAsset => {
        const compareAsset = compareMap.get(currentAsset.id);
        const assetInfo = ASSET_DEPENDENCIES[currentAsset.id];
        
        if (compareAsset && assetInfo) {
          const absoluteChange = currentAsset.price - compareAsset.price;
          const percentageChange = compareAsset.price !== 0 
            ? (absoluteChange / compareAsset.price) * 100 
            : (currentAsset.price !== 0 ? 100 : 0);

          results.push({
            assetId: currentAsset.id,
            assetName: currentAsset.name,
            currentValue: currentAsset.price,
            compareValue: compareAsset.price,
            absoluteChange,
            percentageChange,
            currency: currentAsset.currency,
            type: assetInfo.calculationType
          });
        }
      });

      results.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
      
      setComparisonResults(results);
    } else {
      setComparisonResults([]);
    }
  }, [currentData, compareData]);
  
  const handleExportExcel = async () => {
    if (comparisonResults.length === 0 || !compareDate) return;
    
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comparação de Datas');
      
      const currentDateFormatted = format(currentDate, 'dd/MM/yyyy');
      const compareDateFormatted = format(compareDate, 'dd/MM/yyyy');

      // Título
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Relatório Comparativo de Ativos';
      titleCell.font = { name: 'Calibri', size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Subtítulo
      worksheet.mergeCells('A2:E2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = `Período: ${compareDateFormatted} vs ${currentDateFormatted}`;
      subtitleCell.font = { name: 'Calibri', size: 12 };
      subtitleCell.alignment = { horizontal: 'center' };
      
      worksheet.addRow([]); // Linha em branco

      // Cabeçalhos
      const headerRow = worksheet.addRow([
        'Ativo',
        `Valor (${currentDateFormatted})`,
        `Valor (${compareDateFormatted})`,
        'Variação Absoluta',
        'Variação (%)',
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0070F3' } // Azul
        };
        cell.alignment = { horizontal: 'center' };
      });
      
      // Dados
      comparisonResults.forEach(item => {
        const row = worksheet.addRow([
          item.assetName,
          item.currentValue,
          item.compareValue,
          item.absoluteChange,
          item.percentageChange / 100
        ]);

        // Formatação de moeda
        row.getCell(2).numFmt = `"${item.currency}" #,##0.00`;
        row.getCell(3).numFmt = `"${item.currency}" #,##0.00`;
        row.getCell(4).numFmt = `"${item.currency}" #,##0.00`;
        // Formatação de porcentagem
        row.getCell(5).numFmt = '0.00%';
        
        // Colore a variação
        if (item.percentageChange > 0) {
            row.getCell(5).font = { color: { argb: 'FF008000' } }; // Verde
        } else if (item.percentageChange < 0) {
            row.getCell(5).font = { color: { argb: 'FFFF0000' } }; // Vermelho
        }
      });
      
      // Ajuste de largura das colunas
      worksheet.columns.forEach(column => {
        if (column.values) {
          let maxLength = 0;
          column.values.forEach(value => {
            if (value) {
                const columnLength = value.toString().length;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            }
          });
          column.width = maxLength < 15 ? 15 : maxLength + 2;
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comparacao_${format(currentDate, 'yyyy-MM-dd')}_vs_${format(compareDate, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (comparisonResults.length === 0 || !compareDate) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const currentDateFormatted = format(currentDate, 'dd/MM/yyyy');
      const compareDateFormatted = format(compareDate, 'dd/MM/yyyy');
      const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

      // --- Cabeçalho do Documento ---
      doc.setFontSize(18);
      doc.setTextColor(34, 47, 62); // Cor escura (quase preto)
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Comparativo de Ativos', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 122, 137); // Cinza
      doc.text(`Análise do período de ${compareDateFormatted} a ${currentDateFormatted}`, doc.internal.pageSize.getWidth() / 2, 29, { align: 'center' });
      doc.text(`Gerado em: ${generationDate}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      // Separa os ativos
      const baseAssets = comparisonResults.filter(r => r.type === 'base');
      const calculatedAssets = comparisonResults.filter(r => r.type !== 'base');

      // --- Função para gerar tabela ---
      const generateTable = (title: string, subtitle: string, data: ComparisonData[], startY: number, headerColor: [number, number, number]): number => {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 47, 62);
          doc.text(title, 14, startY);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(108, 122, 137);
          doc.text(subtitle, 14, startY + 5);

          const tableColumn = ["Ativo", `Valor (${compareDateFormatted})`, `Valor (${currentDateFormatted})`, "Variação Absoluta", "Variação (%)"];
          const tableRows = data.map(item => [
              item.assetName,
              formatCurrency(item.compareValue, item.currency, item.assetId),
              formatCurrency(item.currentValue, item.currency, item.assetId),
              `${item.absoluteChange >= 0 ? '+' : ''}${formatCurrency(item.absoluteChange, item.currency, item.assetId)}`,
              `${item.percentageChange >= 0 ? '+' : ''}${item.percentageChange.toFixed(2)}%`
          ]);

          doc.autoTable({
              startY: startY + 10,
              head: [tableColumn],
              body: tableRows,
              theme: 'grid',
              headStyles: { fillColor: headerColor, textColor: 255, fontStyle: 'bold' },
              didDrawCell: (data: any) => {
                  if (data.section === 'body' && data.column.index === 4) { // Coluna de Variação %
                      const text = data.cell.text[0];
                      if (text.includes('+')) {
                          doc.setTextColor(39, 174, 96); // Verde
                          doc.setFont('helvetica', 'bold');
                      } else if (text.includes('-')) {
                          doc.setTextColor(192, 57, 43); // Vermelho
                          doc.setFont('helvetica', 'bold');
                      }
                  }
              },
          });
          return (doc as any).lastAutoTable.finalY;
      };

      // --- Gera as seções ---
      let finalY = generateTable('Ativos Base', 'Valores de mercado que servem como entrada para os cálculos.', baseAssets, 50, [44, 62, 80]); // Azul escuro
      finalY = generateTable('Índices Calculados', 'Resultados dos índices e sub-índices da plataforma.', calculatedAssets, finalY + 15, [22, 160, 133]); // Verde-azulado

      // --- Rodapé ---
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | Monitor do Índice UCS`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`relatorio_comparativo_${format(currentDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const daysDifference = compareDate ? Math.abs(differenceInDays(currentDate, compareDate)) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparação entre Datas
              </CardTitle>
              <CardDescription>
                Compare os valores dos ativos entre diferentes datas para análise de variações.
              </CardDescription>
            </div>
             {comparisonResults.length > 0 && (
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportExcel} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar (XLSX)
                    </Button>
                    <Button onClick={handleExportPdf} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                        Exportar (PDF)
                    </Button>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Data Atual:</span>
            <Badge variant="outline">
              {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Comparar com:</span>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !compareDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {compareDate ? (
                    format(compareDate, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={compareDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date.getTime() === currentDate.getTime()}
                  initialFocus
                  locale={ptBR}
                  blockFuture
                  blockWeekends
                  holidays={BR_HOLIDAYS_2025}
                />
              </PopoverContent>
            </Popover>
          </div>

          {compareDate && (
            <Badge variant="secondary" className="text-xs">
              {daysDifference} dia{daysDifference !== 1 ? 's' : ''} de diferença
            </Badge>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando dados de comparação...
            </span>
          </div>
        )}
        <div ref={comparisonContentRef}>
            {comparisonResults.length > 0 && !isLoading && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                    <div className="font-semibold text-lg text-green-600">
                    {comparisonResults.filter(r => r.percentageChange > 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativos em Alta</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg text-red-600">
                    {comparisonResults.filter(r => r.percentageChange < 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativos em Queda</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg text-blue-600">
                    {Math.max(...comparisonResults.map(r => Math.abs(r.percentageChange))).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Maior Variação</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg">
                    {(comparisonResults.reduce((sum, r) => sum + r.percentageChange, 0) / comparisonResults.length).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Variação Média</div>
                </div>
                </div>

                <ScrollArea className="h-[400px]">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Valor Atual</TableHead>
                        <TableHead className="text-right">Valor Anterior</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-center">Tendência</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {comparisonResults.map((result) => (
                        <TableRow key={result.assetId}>
                        <TableCell className="font-medium">
                            {result.assetName}
                            <div className="text-xs text-muted-foreground">
                            {result.assetId}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {formatCurrency(result.currentValue, result.currency, result.assetId)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {formatCurrency(result.compareValue, result.currency, result.assetId)}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="space-y-1">
                            <div className={cn(
                                "font-mono text-sm",
                                result.percentageChange > 0.01 && "text-green-600",
                                result.percentageChange < -0.01 && "text-red-600"
                            )}>
                                {result.percentageChange > 0 ? '+' : ''}{result.percentageChange.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {result.absoluteChange > 0 ? '+' : ''}{formatCurrency(result.absoluteChange, result.currency, result.assetId)}
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                            {getTrendIcon(result.percentageChange)}
                            {getTrendBadge(result.percentageChange)}
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </ScrollArea>
            </div>
            )}
        </div>

        {!compareDate && (
          <div className="text-center text-sm text-muted-foreground p-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Selecione uma data para comparar com os dados atuais.</p>
            <p className="text-xs mt-2">A comparação mostrará as variações entre as duas datas.</p>
          </div>
        )}

        {compareDate && comparisonResults.length === 0 && !isLoading && (
          <div className="text-center text-sm text-muted-foreground p-8">
            <p>Não foram encontrados dados para comparação na data selecionada.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    

    
