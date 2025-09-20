
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { AreaChart as AreaChartIcon, Table as TableIcon, Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CommodityPriceData, ChartData, FirestoreQuote } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getCotacoesHistorico } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from './ui/skeleton';

interface AssetDetailModalProps {
    asset: CommodityPriceData;
    icon: React.ElementType;
    isOpen: boolean;
    onClose: () => void;
}

export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [formattedPrice, setFormattedPrice] = useState('');

    const getDetails = useCallback(async (currentAsset: CommodityPriceData) => {
        setLoading(true);
        setHistoricalData([]);
        setChartData([]);

        try {
            const history = await getCotacoesHistorico(currentAsset.id);
            
            const formatted = formatCurrency(asset.price, asset.currency);
            setFormattedPrice(formatted);
            
            setHistoricalData(history);

            const chartPoints = [...history].reverse().map((d: FirestoreQuote) => ({
                time: d.data || new Date(d.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: d.ultimo
            }));

            setChartData(chartPoints);

        } catch (error) {
            console.error("Failed to get asset details:", error);
        } finally {
            setLoading(false);
        }
    }, [asset]);

    useEffect(() => {
        if (isOpen) {
            getDetails(asset);
        }
    }, [isOpen, asset, getDetails]);

    const chartConfig = {
        value: {
            label: asset.name,
            color: 'hsl(var(--primary))',
        },
    };

    const renderChart = () => (
        <div className="h-48 w-full"> 
            {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados para exibir o gráfico.
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ left: 5, right: 20, top: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorValueDesktop" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
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
                                tickFormatter={(value: number) => formatCurrency(Number(value), asset.currency)}
                            />
                            <Tooltip 
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                                content={<ChartTooltipContent 
                                    indicator="dot" 
                                    formatter={(value) => [formatCurrency(Number(value), asset.currency), 'Cotação']} 
                                    labelFormatter={(label: string) => `Data: ${label}`}
                                />} 
                            />
                            <Area 
                                dataKey="value" 
                                type="monotone" 
                                fill="url(#colorValueDesktop)" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            )}
        </div>
    );
    
    const renderHistoryTable = () => (
         <div className="flex flex-col h-full">
            <UiTable>
                <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <TableRow>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead className="text-right">Fechamento</TableHead>
                    </TableRow>
                </TableHeader>
            </UiTable>
            <ScrollArea className="flex-1">
                <UiTable>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 7 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="w-[100px]"><Skeleton className="h-4 w-20"/></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 ml-auto"/></TableCell>
                                </TableRow>
                            ))
                        ) : historicalData.length > 0 ? (
                            historicalData.map((dataPoint) => (
                                <TableRow key={dataPoint.id}>
                                    <TableCell className="font-medium text-xs sm:text-sm w-[100px]">{dataPoint.data}</TableCell>
                                    <TableCell className="text-right font-mono text-primary text-xs sm:text-sm">{formatCurrency(dataPoint.ultimo, asset.currency)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    Nenhum dado histórico encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </UiTable>
            </ScrollArea>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] w-[95vw] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="truncate">{asset.name}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Análise detalhada do histórico de preços para {asset.name}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="px-6 py-4 border-b flex-shrink-0">
                     <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="text-3xl sm:text-4xl font-bold text-primary">{formattedPrice}</span>
                        <div className={cn("flex items-baseline gap-2 text-base sm:text-lg font-semibold", asset.absoluteChange >= 0 ? "text-primary" : "text-destructive")}>
                            <span>{asset.absoluteChange >= 0 ? '+' : ''}{formatCurrency(asset.absoluteChange, asset.currency)}</span>
                            <span>({asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%)</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">Última atualização: {asset.lastUpdated}</span>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-6 grid md:grid-cols-2 gap-6 min-h-0">
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-md flex items-center gap-2">
                            <AreaChartIcon className="h-4 w-4 text-muted-foreground"/>
                            Desempenho do Preço
                        </h3>
                        {renderChart()}
                    </div>

                    <div className="flex flex-col gap-2 min-h-0">
                         <h3 className="font-semibold text-md flex items-center gap-2">
                            <TableIcon className="h-4 w-4 text-muted-foreground"/>
                            Cotações Históricas
                        </h3>
                        <div className="flex-1 min-h-0">
                            {renderHistoryTable()}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
