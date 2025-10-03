
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { jsPDF as jsPDFWithAutoTableType } from 'jspdf-autotable';

import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Info, FileDown, Loader2 } from 'lucide-react';
import { AssetDetailModal } from './asset-detail-modal';


const ChartSkeleton = () => (
  <div className="h-72 w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

const TableSkeleton = () => (
    <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
);

type TimeRange = '7d' | '30d' | '90d';
const timeRangeToDays: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function DailyDetailsTable({ quote, asset }: { quote: FirestoreQuote | null, asset?: CommodityConfig }) {
    if (!quote) return null;

    const details = [
        { label: 'Fechamento Anterior', value: quote.fechamento_anterior, type: 'currency' },
        { label: 'Abertura', value: quote.abertura, type: 'currency' },
        { label: 'Máxima do Dia', value: quote.maxima, type: 'currency' },
        { label: 'Mínima do Dia', value: quote.minima, type: 'currency' },
        { label: 'Volume', value: quote.volume, type: 'number' },
        { label: 'Variação (%)', value: quote.variacao_pct, type: 'percentage' },
        { label: 'Rentabilidade Média', value: quote.rent_media, type: 'currency' },
        { label: 'Valor em Toneladas', value: quote.ton, type: 'currency' },
    ];

    const formatValue = (value: any, type: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (type === 'currency') return formatCurrency(value, asset?.currency || 'BRL');
        if (type === 'percentage') return `${Number(value).toFixed(2)}%`;
        if (type === 'number') return Number(value).toLocaleString('pt-BR');
        return String(value);
    };

    const midPoint = Math.ceil(details.length / 2);
    const firstHalf = details.slice(0, midPoint);
    const secondHalf = details.slice(midPoint);

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Table>
                <TableBody>
                    {firstHalf.map(item => item.value !== null && (
                        <TableRow key={item.label}>
                            <TableCell className="font-medium text-muted-foreground">{item.label}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(item.value, item.type)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <Table>
                <TableBody>
                    {secondHalf.map(item => item.value !== null && (
                        <TableRow key={item.label}>
                            <TableCell className="font-medium text-muted-foreground">{item.label}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(item.value, item.type)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


export function HistoricalAnalysis() {
  const [data, setData] = useState<FirestoreQuote[]>([]);
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  // State for the modal
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<CommodityPriceData | null>(null);

  useEffect(() => {
    getCommodityConfigs().then(setAssets);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const days = timeRangeToDays[timeRange];
    
    getCotacoesHistorico(selectedAssetId, days)
      .then((history) => {
        setData(history);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, [timeRange, selectedAssetId]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const { chartData, latestQuote } = useMemo(() => {
    const sortedData = [...data].sort((a, b) => {
        const dateA = typeof a.timestamp === 'number' ? a.timestamp : parseISO(a.timestamp as any).getTime();
        const dateB = typeof b.timestamp === 'number' ? b.timestamp : parseISO(b.timestamp as any).getTime();
        return dateA - dateB;
    });

    const chartPoints = sortedData
      .map((quote) => {
        const dateObject = typeof quote.timestamp === 'number' ? new Date(quote.timestamp) : parseISO(quote.timestamp as any);
        let dateFormat = timeRange === '90d' ? 'MMM' : 'dd/MM';
        return {
           date: format(dateObject, dateFormat, { locale: ptBR }),
           value: quote.valor ?? quote.ultimo,
        }
      });
      
    const latest = data.length > 0 ? data[0] : null;

    return { chartData: chartPoints, latestQuote: latest };
  }, [data, timeRange]);
  
  const handleRowClick = (assetData: CommodityPriceData) => {
    setSelectedAssetForModal(assetData);
  };

  const handleExportPdf = () => {
    if (!selectedAssetConfig || !latestQuote) return;
    setIsExporting(true);
    
    const doc = new jsPDF() as jsPDFWithAutoTableType;
    const timeRangeText = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' }[timeRange];
    const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    const quoteDate = latestQuote.data;

    // --- Header ---
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório de Ativo: ${selectedAssetConfig.name}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dados para o dia: ${quoteDate}`, 14, 28);
    doc.text(`Gráfico de referência: ${timeRangeText}`, 14, 34);
    doc.text(`Gerado em: ${generationDate}`, 14, 40);

    // --- Table ---
    const details = [
        { label: 'Fechamento Anterior', value: latestQuote.fechamento_anterior, type: 'currency' },
        { label: 'Abertura', value: latestQuote.abertura, type: 'currency' },
        { label: 'Máxima do Dia', value: latestQuote.maxima, type: 'currency' },
        { label: 'Mínima do Dia', value: latestQuote.minima, type: 'currency' },
        { label: 'Volume', value: latestQuote.volume, type: 'number' },
        { label: 'Variação (%)', value: latestQuote.variacao_pct, type: 'percentage' },
    ].filter(item => item.value !== null && item.value !== undefined);
    
    const formatValue = (value: any, type: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (type === 'currency') return formatCurrency(value, selectedAssetConfig?.currency || 'BRL');
        if (type === 'percentage') return `${Number(value).toFixed(2)}%`;
        if (type === 'number') return Number(value).toLocaleString('pt-BR');
        return String(value);
    };

    const tableBody = details.map(item => [item.label, formatValue(item.value, item.type)]);

    doc.autoTable({
        startY: 50,
        head: [['Detalhe', 'Valor']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
    });
    
    doc.save(`relatorio_${selectedAssetConfig.id}_${quoteDate.replace(/\//g, '-')}.pdf`);
    setIsExporting(false);
  };

  return (
    <>
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                        <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Selecione um ativo" />
                        </SelectTrigger>
                        <SelectContent>
                            {assets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs 
                        defaultValue={timeRange} 
                        className="w-full sm:w-auto" 
                        onValueChange={(value) => setTimeRange(value as TimeRange)}
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="7d">7D</TabsTrigger>
                            <TabsTrigger value="30d">30D</TabsTrigger>
                            <TabsTrigger value="90d">90D</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleExportPdf}
                      disabled={isLoading || isExporting || data.length === 0}
                    >
                      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-8">
                <div className="h-72" style={{ marginLeft: '-10px' }}>
                {isLoading ? (
                    <ChartSkeleton />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(value as number, selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id)}
                        />
                        <Tooltip
                            contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            }}
                            formatter={(value: any) => [formatCurrency(Number(value), selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id), ' ']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            name=" "
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                        />
                        </LineChart>
                    </ResponsiveContainer>
                )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-2">Detalhes do Dia Selecionado ({latestQuote?.data || 'N/A'})</h3>
                     <div className="flex items-start gap-2 p-3 mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>A tabela abaixo mostra os dados detalhados para o dia mais recente do período selecionado.</p>
                     </div>
                    {isLoading ? <TableSkeleton /> : <DailyDetailsTable quote={latestQuote} asset={selectedAssetConfig} />}
                </div>
            </CardContent>
        </Card>

        {selectedAssetForModal && (
            <AssetDetailModal
                asset={selectedAssetForModal}
                isOpen={!!selectedAssetForModal}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedAssetForModal(null);
                    }
                }}
            />
        )}
    </>
  );
}
