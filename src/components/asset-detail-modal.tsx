
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
import type { CommodityPriceData, ChartData, HistoryInterval, FirestoreQuote } from '@/lib/types';
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
            
            const sortedHistory = [...history].sort((a,b) => {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                return bTime - aTime;
            });
            setHistoricalData(sortedHistory);
            
            const chartPoints = sortedHistory.map((d: FirestoreQuote) => ({ 
                time: new Date(d.timestamp).toLocaleDateString('pt-BR', {day:'2-digit', month: '2-digit'}),
                value: d.ultimo 
            })).reverse();
            
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span>{asset.name} ({asset.ticker})</span>
                </DialogTitle>
                <DialogDescription className="mt-2">
                    Análise detalhada do histórico de preços para {asset.name}. Fonte: n8n.
                </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Price and Chart Section */}
          <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-4xl font-bold text-primary">{formatCurrency(asset.price, asset.currency)}</span>
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
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                            <YAxis 
                                domain={['dataMin - (dataMin * 0.05)', 'dataMax + (dataMax * 0.05)']}
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8} 
                                fontSize={12} 
                                width={80} 
                                tickFormatter={(value) => formatCurrency(Number(value), asset.currency)}
                            />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [formatCurrency(Number(value), asset.currency), 'Valor']}/>} />
                            <Area dataKey="value" type="natural" fill="hsl(var(--primary))" fillOpacity={0.4} stroke="hsl(var(--primary))" />
                        </AreaChart>
                    </ResponsiveContainer>
                   </div>
              )}
          </div>
          
          {/* Historical Data Table Section */}
          <div className="flex flex-col flex-1 min-h-0">
               <h3 className="text-lg font-semibold mb-2">Cotações Históricas (Diário)</h3>
               <div className="flex-1 relative border rounded-md">
                  <ScrollArea className="absolute inset-0">
                      <Table>
                          <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                              <TableRow>
                                  <TableHead className="w-[100px]">Data</TableHead>
                                  <TableHead className="text-right">Fechamento</TableHead>
                                  <TableHead className="text-right">Abertura</TableHead>
                                  <TableHead className="text-right">Máxima</TableHead>
                                  <TableHead className="text-right">Mínima</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {loading ? (
                                  Array.from({length: 10}).map((_, i) => (
                                      <TableRow key={i}>
                                          <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                          <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto"/></TableCell>
                                          <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto"/></TableCell>
                                          <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto"/></TableCell>
                                          <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto"/></TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  historicalData.map((dataPoint) => (
                                      <TableRow key={dataPoint.id}>
                                          <TableCell className="font-medium text-xs">{new Date(dataPoint.timestamp).toLocaleDateString('pt-BR')}</TableCell>
                                          <TableCell className="text-right font-mono text-xs">{formatCurrency(dataPoint.ultimo, asset.currency)}</TableCell>
                                          <TableCell className="text-right font-mono text-xs">{formatCurrency(dataPoint.abertura, asset.currency)}</TableCell>
                                          <TableCell className="text-right font-mono text-xs">{formatCurrency(dataPoint.maxima, asset.currency)}</TableCell>
                                          <TableCell className="text-right font-mono text-xs">{formatCurrency(dataPoint.minima, asset.currency)}</TableCell>
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
