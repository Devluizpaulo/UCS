
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CommodityPriceData, ChartData, FirestoreQuote } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getCotacoesHistorico } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency-service';
import { Skeleton } from './ui/skeleton';


interface AssetDetailModalProps {
    asset: CommodityPriceData;
    icon: React.ElementType;
    isOpen: boolean;
    onClose: () => void;
    selectedDate?: string;
}

// Helper to parse DD/MM/YYYY string to Date object
const parseDateString = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    // Month is 0-indexed in JavaScript Dates
    return new Date(year, month - 1, day);
};


export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose, selectedDate }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    const getDetails = useCallback(async (currentAsset: CommodityPriceData, forDate?: string) => {
        setLoading(true);
        setHistoricalData([]);
        setChartData([]);

        try {
            const history = await getCotacoesHistorico(currentAsset.name, 30, forDate);

            // Sort by the 'data' field, most recent first for the table
            const sortedHistory = [...history].sort((a, b) => {
                const aTime = a.data ? parseDateString(a.data).getTime() : 0;
                const bTime = b.data ? parseDateString(b.data).getTime() : 0;
                return bTime - aTime;
            });
            setHistoricalData(sortedHistory);

            // For the chart, we need the oldest first, so we reverse the sorted array
            const chartPoints = [...sortedHistory].reverse().map((d: FirestoreQuote) => ({
                time: d.data || new Date(d.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: d.ultimo
            }));

            setChartData(chartPoints);

        } catch (error) {
            console.error("Failed to get asset details:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            getDetails(asset, selectedDate);
        }
    }, [isOpen, asset, selectedDate, getDetails]);

    const chartConfig = {
        value: {
            label: asset.name,
            color: 'hsl(var(--primary))',
        },
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl max-h-[95vh] w-[95vw] flex flex-col">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted">
                                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                                </div>
                                <span className="truncate">{asset.name} ({asset.ticker})</span>
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm">
                                Análise detalhada do histórico de preços para {asset.name}. Fonte: n8n.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-6 -mr-6">
                    <div className="flex flex-col gap-6 flex-1 min-h-0">
                        {/* Price Section */}
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <span className="text-3xl sm:text-4xl font-bold text-primary">{formatCurrency(asset.price, asset.currency)}</span>
                            <div className={cn("flex items-baseline gap-2 text-base sm:text-lg font-semibold", asset.absoluteChange >= 0 ? "text-primary" : "text-destructive")}>
                                <span>{asset.absoluteChange >= 0 ? '+' : ''}{asset.absoluteChange.toFixed(4)}</span>
                                <span>({asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%)</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{asset.lastUpdated}</span>
                        </div>

                        {/* Mobile Layout - Cards */}
                        <div className="block md:hidden space-y-4">
                            {/* Chart Card */}
                            <div className="rounded-lg border bg-gradient-to-br from-background to-muted/10 p-4">
                                <h3 className="text-lg font-semibold mb-3 text-foreground">Gráfico de Preços</h3>
                                {loading ? (
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Carregando...</p>
                                        </div>
                                    </div>
                                ) : chartData.length === 0 ? (
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <Icon className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Sem dados</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[200px] w-full">
                                        <ChartContainer config={chartConfig} className="w-full h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                                    <defs>
                                                        <linearGradient id="colorValueMobile" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} vertical={false} />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis hide />
                                                    <Tooltip 
                                                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} 
                                                        content={<ChartTooltipContent 
                                                            indicator="dot" 
                                                            formatter={(value) => [formatCurrency(Number(value), asset.currency), 'Cotação']} 
                                                            labelFormatter={(label) => `Data: ${label}`}
                                                        />} 
                                                    />
                                                    <Area 
                                                        dataKey="value" 
                                                        type="monotone" 
                                                        fill="url(#colorValueMobile)" 
                                                        stroke="hsl(var(--primary))" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                        activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                )}
                            </div>

                            {/* Historical Data Card */}
                            <div className="rounded-lg border bg-gradient-to-br from-background to-muted/5 overflow-hidden">
                                <div className="p-4 border-b bg-gradient-to-r from-muted/95 to-muted/90">
                                    <h3 className="text-lg font-semibold text-foreground">Cotações Históricas</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                                </div>
                                <ScrollArea className="h-64">
                                    <div className="p-2">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 border-b border-border/30">
                                                    <Skeleton className="h-4 w-16" />
                                                    <Skeleton className="h-4 w-20" />
                                                </div>
                                            ))
                                        ) : historicalData.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                                            </div>
                                        ) : (
                                            historicalData.slice(0, 10).map((dataPoint, index) => (
                                                <div key={dataPoint.id} className="flex justify-between items-center p-3 border-b border-border/30 hover:bg-muted/20">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {dataPoint.data || new Date(dataPoint.timestamp).toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Fechamento</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-primary">
                                                            {formatCurrency(dataPoint.ultimo, asset.currency)}
                                                        </p>
                                                        <div className="flex gap-2 text-xs">
                                                            <span className="text-green-600">↑{formatCurrency(dataPoint.maxima, asset.currency)}</span>
                                                            <span className="text-red-600">↓{formatCurrency(dataPoint.minima, asset.currency)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Desktop/Tablet Layout - Two Columns */}
                        <div className="hidden md:grid md:grid-cols-2 gap-6">
                            {/* Chart Column */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground">Gráfico de Preços</h3>
                                {loading ? (
                                    <div className="h-[250px] w-full flex items-center justify-center rounded-lg border bg-gradient-to-br from-background to-muted/20">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground font-medium">Carregando dados históricos...</p>
                                        </div>
                                    </div>
                                ) : chartData.length === 0 ? (
                                    <div className="h-[250px] w-full flex items-center justify-center rounded-lg border bg-gradient-to-br from-background to-muted/20">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <Icon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Nenhum dado disponível</p>
                                                <p className="text-xs text-muted-foreground mt-1">Não há dados históricos para exibir</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[250px] w-full rounded-lg border bg-gradient-to-br from-background to-muted/10 p-4">
                                        <ChartContainer config={chartConfig} className="w-full h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ left: 15, right: 15, top: 15, bottom: 15 }}>
                                                    <defs>
                                                        <linearGradient id="colorValueDesktop" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} vertical={false} />
                                                    <XAxis 
                                                        dataKey="time" 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                        tickMargin={8} 
                                                        fontSize={10}
                                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                                    />
                                                    <YAxis
                                                        domain={['dataMin - (dataMin * 0.02)', 'dataMax + (dataMax * 0.02)']}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        fontSize={10}
                                                        width={70}
                                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                                        tickFormatter={(value) => formatCurrency(Number(value), asset.currency)}
                                                    />
                                                    <Tooltip 
                                                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }} 
                                                        content={<ChartTooltipContent 
                                                            indicator="dot" 
                                                            formatter={(value) => [formatCurrency(Number(value), asset.currency), 'Cotação']} 
                                                            labelFormatter={(label) => `Data: ${label}`}
                                                        />} 
                                                    />
                                                    <Area 
                                                        dataKey="value" 
                                                        type="monotone" 
                                                        fill="url(#colorValueDesktop)" 
                                                        stroke="hsl(var(--primary))" 
                                                        strokeWidth={2}
                                                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                                                        activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                )}
                            </div>

                            {/* Historical Data Column */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Cotações Históricas</h3>
                                    <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                        Últimos 30 dias
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-gradient-to-br from-background to-muted/5 overflow-hidden shadow-sm">
                                    <ScrollArea className="h-[250px] w-full">
                                        <div className="min-w-[400px]">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-gradient-to-r from-muted/95 to-muted/90 backdrop-blur-sm z-10 border-b">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[80px] text-xs font-semibold text-foreground">Data</TableHead>
                                                        <TableHead className="text-right text-xs min-w-[80px] font-semibold text-foreground">Fechamento</TableHead>
                                                        <TableHead className="text-right text-xs min-w-[70px] font-semibold text-foreground">Máx</TableHead>
                                                        <TableHead className="text-right text-xs min-w-[70px] font-semibold text-foreground">Mín</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loading ? (
                                                        Array.from({ length: 6 }).map((_, i) => (
                                                            <TableRow key={i} className="hover:bg-muted/30">
                                                                <TableCell className="py-2">
                                                                    <Skeleton className="h-3 w-16 rounded" />
                                                                </TableCell>
                                                                <TableCell className="text-right py-2">
                                                                    <Skeleton className="h-3 w-16 ml-auto rounded" />
                                                                </TableCell>
                                                                <TableCell className="text-right py-2">
                                                                    <Skeleton className="h-3 w-14 ml-auto rounded" />
                                                                </TableCell>
                                                                <TableCell className="text-right py-2">
                                                                    <Skeleton className="h-3 w-14 ml-auto rounded" />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : historicalData.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-8">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <Icon className="h-8 w-8 text-muted-foreground" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-foreground">Nenhum dado histórico</p>
                                                                        <p className="text-xs text-muted-foreground mt-1">Não há cotações disponíveis</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        historicalData.map((dataPoint, index) => (
                                                            <TableRow key={dataPoint.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                                                                <TableCell className="font-medium text-xs py-2 text-foreground">
                                                                    {dataPoint.data || new Date(dataPoint.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs py-2 font-semibold text-primary">
                                                                    {formatCurrency(dataPoint.ultimo, asset.currency)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs py-2 text-green-600 dark:text-green-400">
                                                                    {formatCurrency(dataPoint.maxima, asset.currency)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs py-2 text-red-600 dark:text-red-400">
                                                                    {formatCurrency(dataPoint.minima, asset.currency)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>


    );
}
