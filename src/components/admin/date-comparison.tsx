
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import ExcelJS from 'exceljs';

interface ComparisonData {
  assetId: string;
  assetName: string;
  currentValue: number;
  compareValue: number;
  absoluteChange: number;
  percentageChange: number;
  currency: string;
}

interface DateComparisonProps {
  currentDate: Date;
  currentData: CommodityPriceData[];
}

function getTrendIcon(percentageChange: number) {
  if (percentageChange > 0) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else if (percentageChange < 0) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function getTrendBadge(percentageChange: number) {
  if (percentageChange > 5) {
    return <Badge variant="default" className="bg-green-100 text-green-800">Alta Significativa</Badge>;
  } else if (percentageChange > 0) {
    return <Badge variant="outline" className="text-green-700">Alta</Badge>;
  } else if (percentageChange < -5) {
    return <Badge variant="destructive">Queda Significativa</Badge>;
  } else if (percentageChange < 0) {
    return <Badge variant="outline" className="text-red-700">Queda</Badge>;
  } else {
    return <Badge variant="secondary">Sem Alteração</Badge>;
  }
}

export function DateComparison({ currentDate, currentData }: DateComparisonProps) {
  const [compareDate, setCompareDate] = useState<Date | undefined>();
  const [compareData, setCompareData] = useState<CommodityPriceData[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
        
        if (compareAsset) {
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
            currency: currentAsset.currency
          });
        }
      });

      results.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
      
      setComparisonResults(results);
    } else {
      setComparisonResults([]);
    }
  }, [currentData, compareData]);
  
  const handleExport = async () => {
    if (comparisonResults.length === 0 || !compareDate) return;
    
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comparação de Datas');
      
      const currentDateFormatted = format(currentDate, 'dd/MM/yyyy');
      const compareDateFormatted = format(compareDate, 'dd/MM/yyyy');

      worksheet.addRow(['Comparação de Ativos']);
      worksheet.addRow([`Período: ${compareDateFormatted} vs ${currentDateFormatted}`]);
      worksheet.addRow([]);

      worksheet.columns = [
        { header: 'Ativo', key: 'name', width: 25 },
        { header: `Valor (${currentDateFormatted})`, key: 'current', width: 20 },
        { header: `Valor (${compareDateFormatted})`, key: 'previous', width: 20 },
        { header: 'Variação Absoluta', key: 'abs', width: 20 },
        { header: 'Variação (%)', key: 'pct', width: 15 },
      ];

      worksheet.getRow(4).font = { bold: true };

      comparisonResults.forEach(item => {
        worksheet.addRow({
          name: item.assetName,
          current: item.currentValue,
          previous: item.compareValue,
          abs: item.absoluteChange,
          pct: item.percentageChange / 100
        });
      });
      
      worksheet.getColumn('current').numFmt = '"R$" #,##0.00';
      worksheet.getColumn('previous').numFmt = '"R$" #,##0.00';
      worksheet.getColumn('abs').numFmt = '"R$" #,##0.00';
      worksheet.getColumn('pct').numFmt = '0.00%';

      const buffer = await workbook.csv.writeBuffer();
      const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `comparacao_${format(currentDate, 'yyyy-MM-dd')}_vs_${format(compareDate, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
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
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                >
                    {isExporting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportar (CSV)
                </Button>
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
                  disabled={(date) => 
                    date > new Date() || date.getTime() === currentDate.getTime()
                  }
                  initialFocus
                  locale={ptBR}
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
                            result.percentageChange > 0 && "text-green-600",
                            result.percentageChange < 0 && "text-red-600"
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
