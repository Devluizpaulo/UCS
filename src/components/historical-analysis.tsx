
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
import type { jsPDF as jsPDFWithAutoTable } from 'jspdf-autotable';

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
import { ChevronLeft, ChevronRight, Info, FileDown, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
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

const ITEMS_PER_PAGE = 10;

function HistoricalDataTable({ 
    data, 
    asset, 
    isLoading,
    onRowClick,
}: { 
    data: FirestoreQuote[], 
    asset?: CommodityPriceData, 
    isLoading: boolean,
    onRowClick: (asset: CommodityPriceData, quote: FirestoreQuote) => void,
}) {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [data]);
    
    // Dynamically determine columns from all keys in the dataset
    const columns = useMemo(() => {
        if (data.length === 0) return [];
        const allKeys = new Set<string>();
        data.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });
        
        // Define a preferred order
        const preferredOrder = ['data', 'ultimo', 'valor', 'abertura', 'maxima', 'minima', 'variacao_pct', 'fechamento_anterior', 'rent_media', 'ton', 'volume'];
        
        // Filter out keys we don't want to show and sort
        const filteredKeys = Array.from(allKeys).filter(key => !['id', 'timestamp', 'componentes', 'conversoes', 'valores_originais', 'moedas', 'ativo', 'fonte', 'status', 'formula'].includes(key));
        
        filteredKeys.sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        return filteredKeys;
    }, [data]);

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [data, currentPage]);
    
    const formatValue = (value: any, key: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (key === 'data') return String(value);

        if (key.includes('pct')) {
            return typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A';
        }
        
        if (typeof value === 'number') {
            return formatCurrency(value, asset?.currency || 'BRL');
        }

        if (typeof value === 'object' && value.seconds) { // Firestore Timestamp
             return format(new Date(value.seconds * 1000), 'dd/MM/yyyy HH:mm');
        }

        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
             return format(new Date(value), 'dd/MM/yyyy HH:mm');
        }
        
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }
    
    if (isLoading) {
        return <TableSkeleton />;
    }

    if (data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhum dado histórico encontrado para este período.</p>;
    }
    
    const handleRowClick = (quote: FirestoreQuote) => {
        if (!asset) return;
        const assetData: CommodityPriceData = {
            ...asset,
            price: quote.valor ?? quote.ultimo,
            change: quote.variacao_pct ?? 0,
            absoluteChange: 0, // Not available in historical, can be calculated if needed
            lastUpdated: quote.data,
        };
        onRowClick(assetData, quote);
    };

    return (
        <div className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(key => <TableHead key={key}>{key}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map(quote => (
                            <TableRow key={quote.id} onClick={() => handleRowClick(quote)} className="cursor-pointer">
                                {columns.map(key => (
                                    <TableCell key={key} className="whitespace-nowrap font-mono text-xs">
                                        {formatValue((quote as any)[key], key)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                    <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Próximo <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
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

  const chartData = useMemo(() => {
    return data
      .map((quote) => {
        const dateObject = typeof quote.timestamp === 'number' ? new Date(quote.timestamp) : parseISO(quote.timestamp as any);
        let dateFormat = timeRange === '90d' ? 'MMM' : 'dd/MM';
        return {
           date: format(dateObject, dateFormat, { locale: ptBR }),
           value: quote.valor ?? quote.ultimo,
        }
      })
      .reverse(); // Ensure chronological order for the chart
  }, [data, timeRange]);
  
  const handleRowClick = (assetData: CommodityPriceData) => {
    setSelectedAssetForModal(assetData);
  };

  const handleExportPdf = () => {
    if (!selectedAssetConfig || data.length === 0) return;
    setIsExporting(true);
    
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const timeRangeText = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' }[timeRange];
    const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });

    // --- Header ---
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório Histórico: ${selectedAssetConfig.name}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${timeRangeText}`, 14, 28);
    doc.text(`Gerado em: ${generationDate}`, 14, 34);

    // --- Table ---
    const tableColumn = ["Data", "Preço", "Variação (%)"];
    const tableRows = data.map(quote => {
        const price = quote.valor ?? quote.ultimo;
        const change = quote.variacao_pct ?? 0;
        return [
            quote.data,
            formatCurrency(price, selectedAssetConfig.currency, selectedAssetConfig.id),
            `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
        ];
    });

    doc.autoTable({
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) { // Change % column
                const text = data.cell.text[0];
                if (text.includes('+')) {
                    doc.setTextColor(39, 174, 96); // Green
                } else if (text.includes('-')) {
                    doc.setTextColor(192, 57, 43); // Red
                }
            }
        },
    });
    
    doc.save(`relatorio_${selectedAssetConfig.id}_${timeRange}.pdf`);
    setIsExporting(false);
  };

  return (
    <>
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="h-72">
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
                     <h3 className="text-lg font-semibold mb-2">Dados Históricos Detalhados</h3>
                     <div className="flex items-start gap-2 p-3 mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>Clique em uma linha da tabela para ver os detalhes completos da cotação daquele dia.</p>
                     </div>
                    <HistoricalDataTable 
                        data={data} 
                        asset={selectedAssetConfig as CommodityPriceData} 
                        isLoading={isLoading} 
                        onRowClick={handleRowClick}
                    />
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
