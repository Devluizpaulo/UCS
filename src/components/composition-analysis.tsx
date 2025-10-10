
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteByDate, getCommodityPricesByDate } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PdfExportButton } from './pdf-export-button';
import { ExcelExportButton } from './excel-export-button';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import * as React from 'react';
import { CompositionPieChart } from '@/components/charts/composition-pie-chart';

interface CompositionAnalysisProps {
  targetDate: Date;
}

const componentNames: Record<string, string> = {
  vus: 'VUS (Valor de Uso do Solo)',
  vmad: 'VMAD (Valor da Madeira)',
  carbono_crs: 'Carbono CRS',
  Agua_CRS: 'Água CRS',
  crs_total: 'CRS (Custo de Resp. Socioambiental)'
};

export function CompositionAnalysis({ targetDate }: CompositionAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getQuoteByDate('valor_uso_solo', targetDate);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch composition data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [targetDate]);

  const { chartData, tableData, mainAssetData, hasDuplication } = useMemo(() => {
    if (!data?.componentes || !data.valor) return { chartData: [], tableData: [], mainAssetData: null, hasDuplication: false };

    const componentes = data.componentes;
    const valorTotal = data.valor;

    const componentKeys = Object.keys(componentes);
    const uniqueKeys = new Set(componentKeys);
    const hasDuplication = componentKeys.length !== uniqueKeys.size;

    if (hasDuplication) {
      console.warn('⚠️ Duplicação detectada nos componentes:', {
        totalKeys: componentKeys.length,
        uniqueKeys: uniqueKeys.size,
        duplicatedKeys: componentKeys.filter(key => {
          const count = componentKeys.filter(k => k === key).length;
          return count > 1;
        })
      });
    }

    const vus = { id: 'vus', name: componentNames.vus, value: (componentes.vus || 0) as number };
    const vmad = { id: 'vmad', name: componentNames.vmad, value: (componentes.vmad || 0) as number };
    const carbono_crs = { id: 'carbono_crs', name: componentNames.carbono_crs, value: (componentes.carbono_crs || 0) as number };
    const agua_crs = { id: 'Agua_CRS', name: componentNames.Agua_CRS, value: (componentes.agua_crs || 0) as number };
    
    const crsTotalValue = carbono_crs.value + agua_crs.value;
    const expectedTotal = vus.value + vmad.value + crsTotalValue;
    const totalDifference = Math.abs(valorTotal - expectedTotal);
    
    if (totalDifference > 0.01) { 
      console.warn('⚠️ Inconsistência nos valores:', {
        valorTotal,
        expectedTotal,
        difference: totalDifference,
        components: { vus: vus.value, vmad: vmad.value, carbono_crs: carbono_crs.value, agua_crs: agua_crs.value }
      });
    }
    
    const crsTotal = { id: 'crs_total', name: componentNames.crs_total, value: crsTotalValue };
    
    const chartItems = [vus, vmad, crsTotal].filter(item => item.value > 0);

    const tableItems = [
      { ...vus, percentage: valorTotal > 0 ? (vus.value / valorTotal) * 100 : 0, isSub: false },
      { ...vmad, percentage: valorTotal > 0 ? (vmad.value / valorTotal) * 100 : 0, isSub: false },
      { ...crsTotal, percentage: valorTotal > 0 ? (crsTotal.value / valorTotal) * 100 : 0, isSub: false },
      { ...carbono_crs, percentage: valorTotal > 0 ? (carbono_crs.value / valorTotal) * 100 : 0, isSub: true, parent: 'crs_total' },
      { ...agua_crs, percentage: valorTotal > 0 ? (agua_crs.value / valorTotal) * 100 : 0, isSub: true, parent: 'crs_total' },
    ].filter(item => item.value > 0);
    
    const mainAsset: CommodityPriceData | null = {
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

    return { chartData: chartItems, tableData: tableItems, mainAssetData: mainAsset, hasDuplication };
  }, [data]);
  
  const handleExportExcel = async () => {
    if (!data || tableData.length === 0) return;
    setIsExporting(true);

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UCS Index Platform';
        workbook.created = new Date();

        const summarySheet = workbook.addWorksheet('Análise de Composição');
        
        summarySheet.mergeCells('A1:F1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = '🍕 Relatório de Composição - Valor de Uso do Solo';
        titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16a34a' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        summarySheet.mergeCells('A2:F2');
        const dateCell = summarySheet.getCell('A2');
        dateCell.value = `📅 Data: ${data.data} | 💰 Valor Total: ${formatCurrency(data.valor, 'BRL')}`;
        dateCell.font = { size: 12, color: { argb: 'FF4b5563' } };
        dateCell.alignment = { horizontal: 'center' };

        summarySheet.getRow(4).values = ['Componente', 'Valor (R$)', 'Participação (%)', 'Visualização'];
        const headerRow = summarySheet.getRow(4);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f2937' } };
            cell.alignment = { horizontal: 'center' };
        });

        tableData.forEach((item, index) => {
            const row = summarySheet.getRow(5 + index);
            const percentage = item.percentage;
            const barLength = Math.round(percentage / 5); 
            const barVisual = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            
            row.getCell(1).value = item.isSub ? `  └─ ${item.name}` : item.name;
            row.getCell(2).value = item.value;
            row.getCell(2).numFmt = '"R$"#,##0.00';
            row.getCell(3).value = item.percentage / 100;
            row.getCell(3).numFmt = '0.00%';
            row.getCell(4).value = barVisual;
        });
        
        const totalRow = summarySheet.getRow(5 + tableData.length);
        totalRow.getCell(1).value = 'TOTAL';
        totalRow.getCell(2).value = data.valor;
        totalRow.getCell(3).value = 1;
        totalRow.getCell(4).value = '█'.repeat(20);
        totalRow.font = { bold: true, size: 12 };
        totalRow.getCell(2).numFmt = '"R$"#,##0.00';
        totalRow.getCell(3).numFmt = '0.00%';
        
        summarySheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell!({ includeEmpty: true }, cell => {
                let cellLength = cell.value ? cell.value.toString().length : 10;
                if (cell.numFmt?.includes('%')) cellLength += 1;
                if (maxLength < cellLength) maxLength = cellLength;
            });
            column.width = maxLength < 15 ? 15 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `composicao_valor_uso_solo_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);
        
    } catch (error) {
        console.error("Excel export failed:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const pdfComponentData: CommodityPriceData[] = tableData.map((item) => ({
      id: item.id, 
      name: item.name, 
      price: item.value, 
      change: item.percentage, 
      absoluteChange: 0, 
      currency: 'BRL', 
      category: item.isSub ? 'sub-index' : 'index', 
      description: '', 
      unit: 'R$', 
      lastUpdated: data.data,
  }));

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

  if (!data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Indisponíveis</CardTitle>
          <CardDescription>Não foi possível carregar os dados de composição para a data selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72 text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhuma composição encontrada para {targetDate.toLocaleDateString('pt-BR')}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {hasDuplication && (
        <Alert className="lg:col-span-5 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>⚠️ Duplicação Detectada:</strong> Foram encontrados componentes duplicados. Verifique o console para mais detalhes.
          </AlertDescription>
        </Alert>
      )}
      
       <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                       <PieChartIcon className="h-5 w-5 text-primary"/>
                       Composição do Índice "Valor de Uso do Solo"
                    </CardTitle>
                    <CardDescription>
                        Distribuição dos componentes para {formatCurrency(data.valor, 'BRL', 'valor_uso_solo')} em {data.data}.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <PdfExportButton
                        data={{
                            mainIndex: mainAssetData ?? undefined,
                            secondaryIndices: [],
                            currencies: [],
                            otherAssets: pdfComponentData,
                            targetDate: targetDate,
                        }}
                        reportType="composition"
                        disabled={isExporting}
                    />
                    <ExcelExportButton
                      data={{
                        mainIndex: mainAssetData || undefined,
                        secondaryIndices: [],
                        currencies: [],
                        otherAssets: pdfComponentData,
                        targetDate: targetDate
                      }}
                      onExport={handleExportExcel}
                      variant="outline"
                      size="sm"
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-96">
            <CompositionPieChart data={chartData} />
          </CardContent>
        </Card>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Valores Detalhados</CardTitle>
            <CardDescription>Análise tabular de cada componente do índice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Componente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.filter(item => !item.isSub).map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow className={item.id === 'crs_total' ? 'font-bold bg-muted/30' : ''}>
                      <TableCell className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(var(--chart-${chartData.findIndex(c => c.id === item.id) + 1}))`}} />
                        <span className="font-medium">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.value, 'BRL')}</TableCell>
                      <TableCell className="text-right font-mono">{item.percentage.toFixed(2)}%</TableCell>
                    </TableRow>
                    {item.id === 'crs_total' && tableData.filter(sub => 'parent' in sub && sub.parent === 'crs_total').map(subItem => (
                      <TableRow key={subItem.id}>
                        <TableCell className="pl-8 flex items-center gap-2">
                          <span className="text-muted-foreground">└─</span>
                          <span>{subItem.name}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(subItem.value, 'BRL')}</TableCell>
                        <TableCell className="text-right font-mono">{subItem.percentage.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                <TableRow className="font-bold bg-muted/50 border-t-2">
                   <TableCell>Total</TableCell>
                   <TableCell className="text-right font-mono">{formatCurrency(data.valor, 'BRL', 'valor_uso_solo')}</TableCell>
                   <TableCell className="text-right font-mono">100.00%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
