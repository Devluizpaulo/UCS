
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
import type { FirestoreQuote, CommodityConfig } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

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

function HistoricalDataTable({ data, asset, isLoading }: { data: FirestoreQuote[], asset?: CommodityConfig, isLoading: boolean }) {
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
        const preferredOrder = ['data', 'ultimo', 'valor', 'abertura', 'maxima', 'minima', 'variacao_pct', 'fechamento_anterior', 'rent_media', 'ton', 'volume', 'fonte', 'status'];
        
        // Filter out keys we don't want to show and sort
        const filteredKeys = Array.from(allKeys).filter(key => !['id', 'timestamp', 'componentes', 'conversoes', 'valores_originais', 'moedas', 'ativo'].includes(key));
        
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
                            <TableRow key={quote.id}>
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
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

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

  const selectedAsset = useMemo(() => {
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

  return (
    <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
                <CardTitle>Performance Histórica do Ativo</CardTitle>
                <CardDescription>
                Selecione um ativo e um período para visualizar a evolução do valor e os dados detalhados.
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Selecione um ativo" />
                </SelectTrigger>
                <SelectContent>
                    {assets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
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
                        tickFormatter={(value) => formatCurrency(value as number, selectedAsset?.currency || 'BRL', selectedAsset?.id)}
                    />
                    <Tooltip
                        contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value), selectedAsset?.currency || 'BRL', selectedAsset?.id), selectedAsset?.name || 'Valor']}
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
                 <p className="text-sm text-muted-foreground mb-4">Tabela completa com todos os dados diários para o ativo <span className="font-bold">{selectedAsset?.name || 'selecionado'}</span>.</p>
                <HistoricalDataTable data={data} asset={selectedAsset} isLoading={isLoading} />
            </div>
        </CardContent>
    </Card>
  );
}
