
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteByDate } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Download, PieChart as PieChartIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PdfExportButton } from './pdf-export-button';
import type { CommodityPriceData } from '@/lib/types';
import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CompositionAnalysisProps {
  targetDate: Date;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

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

  const { chartData, tableData, mainAssetData } = useMemo(() => {
    if (!data?.componentes || !data.valor) return { chartData: [], tableData: [], mainAssetData: null };

    const componentes = data.componentes;
    const valorTotal = data.valor;

    const vus = { id: 'vus', name: componentNames.vus, value: (componentes.vus || 0) as number };
    const vmad = { id: 'vmad', name: componentNames.vmad, value: (componentes.vmad || 0) as number };
    const carbono_crs = { id: 'carbono_crs', name: componentNames.carbono_crs, value: (componentes.carbono_crs || 0) as number };
    const agua_crs = { id: 'Agua_CRS', name: componentNames.Agua_CRS, value: (componentes.Agua_CRS || 0) as number };
    
    const crsTotalValue = carbono_crs.value + agua_crs.value;
    const crsTotal = { id: 'crs_total', name: componentNames.crs_total, value: crsTotalValue };
    
    const chartItems = [vus, vmad, crsTotal].filter(item => item.value > 0);

    const tableItems: ({
        percentage: number;
        isSub: boolean;
        id: string;
        name: string;
        value: number;
        parent?: undefined;
    } | {
        percentage: number;
        isSub: boolean;
        parent: string;
        id: string;
        name: string;
        value: number;
    })[] = [
      { ...vus, percentage: valorTotal > 0 ? (vus.value / valorTotal) * 100 : 0, isSub: false },
      { ...vmad, percentage: valorTotal > 0 ? (vmad.value / valorTotal) * 100 : 0, isSub: false },
      { ...crsTotal, percentage: valorTotal > 0 ? (crsTotal.value / valorTotal) * 100 : 0, isSub: false },
      { ...carbono_crs, percentage: valorTotal > 0 ? (carbono_crs.value / valorTotal) * 100 : 0, isSub: true, parent: 'crs_total' },
      { ...agua_crs, percentage: valorTotal > 0 ? (agua_crs.value / valorTotal) * 100 : 0, isSub: true, parent: 'crs_total' },
    ].filter(item => item.value > 0);
    
    const mainAsset: CommodityPriceData = {
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

    return { chartData: chartItems, tableData: tableItems, mainAssetData: mainAsset };
  }, [data]);
  
  const handleExportExcel = async () => {
    if (!data || tableData.length === 0) return;
    setIsExporting(true);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Composição');

    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'Relatório de Composição - Valor de Uso do Solo';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = `Data: ${data.data}`;
    worksheet.getCell('A2').font = { size: 12 };
    
    worksheet.getRow(4).values = ['Componente', 'Valor (R$)', 'Participação (%)'];
    worksheet.getRow(4).font = { bold: true };

    tableData.forEach((item, index) => {
        const row = worksheet.getRow(5 + index);
        row.getCell(1).value = item.isSub ? `  ${item.name}` : item.name;
        row.getCell(2).value = item.value;
        row.getCell(2).numFmt = '"R$"#,##0.00';
        row.getCell(3).value = item.percentage / 100;
        row.getCell(3).numFmt = '0.00%';
        if (item.id === 'crs_total') {
            row.font = { bold: true };
        }
    });
    
    const totalRow = worksheet.getRow(5 + tableData.length);
    totalRow.getCell(1).value = 'Total';
    totalRow.getCell(2).value = data.valor;
    totalRow.getCell(3).value = 1;
    totalRow.font = { bold: true };
    totalRow.getCell(2).numFmt = '"R$"#,##0.00';
    totalRow.getCell(3).numFmt = '0.00%';

    worksheet.columns.forEach((column: Partial<ExcelJS.Column>) => {
        let max_width = 0;
        if (column.eachCell) {
          column.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
              const columnWidth = cell.value ? cell.value.toString().length : 10;
              if (columnWidth > max_width) {
                  max_width = columnWidth;
              }
          });
        }
        column.width = max_width < 12 ? 12 : max_width + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `composicao_valor_uso_solo_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);
    setIsExporting(false);
  };

  const pdfComponentData = tableData.map((item): CommodityPriceData => ({
      id: item.id, 
      name: item.name, 
      price: item.value, 
      change: item.percentage, 
      absoluteChange: 0, 
      currency: 'BRL', 
      category: 'sub-index', 
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
    <div className="grid grid-cols-1 gap-8">
       <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                       <PieChartIcon className="h-5 w-5 text-primary"/>
                       Composição do Índice "Valor de Uso do Solo"
                    </CardTitle>
                    <CardDescription>
                        Distribuição dos componentes que formam o valor total de {formatCurrency(data.valor, 'BRL', 'valor_uso_solo')} em {data.data}.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <PdfExportButton
                        data={{
                            mainIndex: mainAssetData || undefined,
                            secondaryIndices: [],
                            currencies: [],
                            otherAssets: pdfComponentData,
                            targetDate: targetDate,
                        }}
                        reportType="composition"
                        disabled={isExporting}
                    />
                    <Button onClick={handleExportExcel} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exportar (XLSX)
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value, 'BRL'), 'Valor']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Valores Detalhados dos Componentes</CardTitle>
            <CardDescription>Análise tabular de cada componente do índice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Componente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.filter(item => !item.isSub).map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow className={item.id === 'crs_total' ? 'font-bold bg-muted/30' : ''}>
                      <TableCell className="flex items-center gap-2">
                        {item.id !== 'crs_total' && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[chartData.findIndex(c => c.id === item.id) % COLORS.length] }} />}
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
