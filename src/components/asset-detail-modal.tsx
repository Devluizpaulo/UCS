
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CommodityPriceData, ChartData, HistoryInterval, FirestoreQuote } from '@/lib/types';
import { Loader2, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getCotacoesHistorico } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';


interface AssetDetailModalProps {
  asset: CommodityPriceData;
  icon: React.ElementType;
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
}

const intervalLimitMap: Record<HistoryInterval, number> = {
    '1d': 30,
    '1wk': 26,
    '1mo': 60
}


export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose, selectedDate }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [interval, setInterval] = useState<HistoryInterval>('1d');


    const getDetails = useCallback(async (currentAsset: CommodityPriceData, currentInterval: HistoryInterval, forDate?: string) => {
        setLoading(true);
        setHistoricalData([]);
        setChartData([]);

        try {
            const limit = intervalLimitMap[currentInterval];
            const history = await getCotacoesHistorico(currentAsset.name, limit, forDate);
            setHistoricalData(history);
            
            const chartPoints = history.map((d: FirestoreQuote) => ({ 
                time: new Date(d.timestamp).toLocaleDateString('pt-BR', {day:'2-digit', month: '2-digit'}),
                value: d.ultimo 
            }));
            
            setChartData(chartPoints.reverse());

        } catch (error) {
            console.error("Failed to get asset details:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            getDetails(asset, interval, selectedDate);
        }
    }, [isOpen, asset, interval, selectedDate, getDetails]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <DialogTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span>{asset.name} ({asset.ticker})</span>
                </DialogTitle>
                <DialogDescription className="mt-2">
                    Análise detalhada do histórico de preços para {asset.name}. Fonte: n8n.
                </DialogDescription>
            </div>
            <Tabs defaultValue="1d" onValueChange={(value) => setInterval(value as HistoryInterval)} className="w-auto shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="1d">Diário</TabsTrigger>
                    <TabsTrigger value="1wk">Semanal</TabsTrigger>
                    <TabsTrigger value="1mo">Mensal</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 flex-1 min-h-0">
             <div className="flex flex-col gap-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="text-4xl font-bold text-primary">{asset.currency} {asset.price.toFixed(4)}</span>
                        <div className={cn("flex items-baseline gap-2 text-lg font-semibold", asset.absoluteChange >= 0 ? "text-primary" : "text-destructive")}>
                            <span>{asset.absoluteChange >= 0 ? '+' : ''}{asset.absoluteChange.toFixed(4)}</span>
                            <span>({asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{asset.lastUpdated}</span>
                    </div>
                    {loading ? (
                        <div className="h-[250px] w-full flex items-center justify-center rounded-md border">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                            <p className="text-sm text-muted-foreground ml-2">Carregando gráfico...</p>
                        </div>
                    ) : (
                        <ChartContainer config={{
                            value: { label: 'Valor', color: 'hsl(var(--primary))' },
                        }} className="h-[250px] w-full">
                            <AreaChart accessibilityLayer data={chartData} margin={{ left: -10, right: 12, top: 10, bottom: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                <YAxis 
                                    domain={['dataMin - (dataMin * 0.05)', 'dataMax + (dataMax * 0.05)']}
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8} 
                                    fontSize={12} 
                                    width={70} 
                                    tickFormatter={(value) => `${asset.currency} ${Number(value).toFixed(2)}`}
                                />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Area dataKey="value" type="natural" fill="var(--color-value)" fillOpacity={0.4} stroke="var(--color-value)" />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </div>
             </div>
             <div className="flex flex-col min-h-0">
                 <h3 className="text-lg font-semibold mb-4">Cotações Históricas ({interval === '1d' ? 'Diário' : interval === '1wk' ? 'Semanal' : 'Mensal'})</h3>
                 <div className="flex-1 relative">
                    <ScrollArea className="absolute inset-0">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead className="w-[80px]">Data</TableHead>
                                    <TableHead className="text-right">Fechamento</TableHead>
                                    <TableHead className="text-right">Abertura</TableHead>
                                    <TableHead className="text-right">Máxima</TableHead>
                                    <TableHead className="text-right">Mínima</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({length: 15}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-5 w-16 bg-muted rounded-md animate-pulse"/></TableCell>
                                            <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                            <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                            <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                            <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    historicalData.map((dataPoint) => (
                                        <TableRow key={dataPoint.id}>
                                            <TableCell className="font-medium text-xs">{new Date(dataPoint.timestamp).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{asset.currency} {dataPoint.ultimo.toFixed(4)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{dataPoint.abertura.toFixed(4)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{dataPoint.maxima.toFixed(4)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{dataPoint.minima.toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
