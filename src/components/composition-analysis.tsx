
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { ptBR } from 'date-fns/locale';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PdfExportButton } from './pdf-export-button';
import type { CommodityPriceData } from '@/lib/types';


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
  crs: 'CRS (Custo de Resp. Socioambiental)',
};

const KpiCard = ({ title, value, percentage, color }: { title: string; value: number; percentage: number; color: string }) => (
    <Card className="flex-1 min-w-[200px] hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-bold font-mono">
                {formatCurrency(value, 'BRL')}
            </div>
            <div 
                className="relative flex items-center justify-center w-20 h-20 rounded-full"
                style={{
                    background: `conic-gradient(${color} ${percentage}%, hsl(var(--muted)) ${percentage}%)`
                }}
            >
                <div className="absolute flex items-center justify-center w-[calc(100%-12px)] h-[calc(100%-12px)] bg-card rounded-full">
                    <span className="text-xl font-bold" style={{ color }}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

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

  const { chartData, mainAssetData } = useMemo(() => {
    if (!data?.componentes) return { chartData: [], mainAssetData: null };

    const componentes = data.componentes;
    const valorTotal = data.valor || 1;

    const vusValue = (componentes.vus || 0) as number;
    const vmadValue = (componentes.vmad || 0) as number;
    const carbonoCRSValue = (componentes.carbono_crs || 0) as number;
    const aguaCRSValue = (componentes.Agua_CRS || 0) as number;
    
    const crsTotalValue = carbonoCRSValue + aguaCRSValue;

    const groupedData = [
      {
        name: componentNames.vus,
        value: vusValue,
        percentage: valorTotal > 0 ? (vusValue / valorTotal) * 100 : 0,
      },
      {
        name: componentNames.vmad,
        value: vmadValue,
        percentage: valorTotal > 0 ? (vmadValue / valorTotal) * 100 : 0,
      },
      {
        name: componentNames.crs,
        value: crsTotalValue,
        percentage: valorTotal > 0 ? (crsTotalValue / valorTotal) * 100 : 0,
      }
    ];

    const mainAsset: CommodityPriceData = {
        id: 'valor_uso_solo',
        name: 'Valor de Uso do Solo',
        price: data.valor,
        change: data.variacao_pct,
        absoluteChange: data.variacao_abs,
        currency: 'BRL',
        category: 'index',
        description: 'Índice de composição do uso do solo.',
        unit: 'Pontos',
        lastUpdated: data.data,
    };

    return { chartData: groupedData.filter(item => item.value > 0), mainAssetData: mainAsset };
  }, [data]);
  
  const handleExportExcel = async () => {
    if (!data || chartData.length === 0) return;
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

    chartData.forEach((item, index) => {
        const row = worksheet.getRow(5 + index);
        row.getCell(1).value = item.name;
        row.getCell(2).value = item.value;
        row.getCell(2).numFmt = '"R$"#,##0.00';
        row.getCell(3).value = item.percentage / 100;
        row.getCell(3).numFmt = '0.00%';
    });
    
    const totalRow = worksheet.getRow(5 + chartData.length);
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


  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                <Skeleton className="h-32 flex-1 min-w-[200px]" />
                <Skeleton className="h-32 flex-1 min-w-[200px]" />
                <Skeleton className="h-32 flex-1 min-w-[200px]" />
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
    <div className="space-y-8">
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
                                mainIndex: mainAssetData,
                                secondaryIndices: [], // Dados de composição são específicos
                                currencies: [],
                                otherAssets: chartData.map(item => ({
                                  id: item.name,
                                  name: item.name,
                                  price: item.value,
                                  change: item.percentage,
                                  absoluteChange: 0, // Não aplicável aqui
                                  currency: 'BRL',
                                  category: 'component',
                                  description: '',
                                  unit: 'R$',
                                  lastUpdated: data.data,
                                })),
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
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-4">
               {chartData.map((item, index) => (
                    <KpiCard 
                        key={item.name}
                        title={item.name}
                        value={item.value}
                        percentage={item.percentage}
                        color={COLORS[index % COLORS.length]}
                    />
                ))}
            </CardContent>
        </Card>
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
                            <TableHead className="text-right">Participação (%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chartData.map((item, index) => (
                            <TableRow key={item.name}>
                                <TableCell className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="font-medium">{item.name}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.value, 'BRL')}</TableCell>
                                <TableCell className="text-right font-mono">{item.percentage.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(data.valor, 'BRL', 'valor_uso_solo')}</TableCell>
                            <TableCell className="text-right font-mono">100.00%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
