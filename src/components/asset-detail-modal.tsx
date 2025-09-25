
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';
import { getCotacoesHistorico } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { HistoricalPriceTable } from './historical-price-table';
import { isCalculableAsset } from '@/lib/calculation-service';
import { CalculatedAssetDetails } from './calculated-asset-details';
import { ScrollArea } from './ui/scroll-area';

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AssetDetailModal({ asset, isOpen, onOpenChange }: AssetDetailModalProps) {
  const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isCalculated = isCalculableAsset(asset.id);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Fetch last 90 days of data for the components
      getCotacoesHistorico(asset.id, 90)
        .then((data) => {
          setHistoricalData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setHistoricalData([]);
          setIsLoading(false);
        });
    }
  }, [asset.id, isOpen]);

  const chartData = useMemo(() => {
    // Use last 30 entries for the chart for better readability
    return historicalData
      .slice(0, 30) 
      .map((quote) => {
        const dateObject = typeof quote.timestamp === 'number' ? new Date(quote.timestamp) : parseISO(quote.timestamp as any);
         return {
            date: format(dateObject, 'dd/MM'),
            price: quote.valor ?? quote.ultimo,
         }
      })
      .reverse(); // Ensure chronological order for the chart
  }, [historicalData]);

  const Icon = getIconForCategory(asset);
  const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
  const ChangeIcon = asset.change >= 0 ? ArrowUp : ArrowDown;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 grid grid-rows-[auto_minmax(0,1fr)] max-h-[90svh]">
         <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <DialogTitle className="text-xl font-bold">{asset.name}</DialogTitle>
            </div>
            <DialogDescription>{asset.description}</DialogDescription>
         </DialogHeader>

        <ScrollArea className="w-full">
            <div className="grid md:grid-cols-[280px_1fr] h-full p-6 pt-2">
            {/* ASSET INFO SIDEBAR */}
            <div className="flex flex-col gap-6 border-b md:border-b-0 md:border-r md:pr-6 pb-6 mb-6 md:pb-0 md:mb-0">
                <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono">
                    {formatCurrency(asset.price, asset.currency, asset.id)}
                    </span>
                    <span className="text-sm text-muted-foreground">{asset.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn('flex items-center text-sm font-semibold', changeColor)}>
                    <ChangeIcon className="h-4 w-4 mr-1" />
                    <span>{asset.change.toFixed(2)}%</span>
                    <span className="mx-1">/</span>
                    <span>{formatCurrency(asset.absoluteChange, asset.currency, asset.id)}</span>
                    <span className="text-xs text-muted-foreground ml-1">(24h)</span>
                    </div>
                </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mt-auto">
                    <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Categoria:</span> 
                    <Badge variant="secondary">{asset.category.toUpperCase()}</Badge>
                    </div>
                    {isCalculated && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">Tipo:</span>
                            <Badge variant="outline">Índice Calculado</Badge>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Moeda:</span>
                    <span>{asset.currency}</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-col md:pl-6">
                <div className="grid gap-6">
                    {/* CHART */}
                    <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Preços (Últimos 30 Dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value as number, asset.currency, asset.id)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                formatter={(value: any) => [formatCurrency(Number(value), asset.currency, asset.id), 'Preço']}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                            />
                            </LineChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                    </Card>

                    {/* HISTORICAL DATA */}
                    {isCalculated ? (
                        <CalculatedAssetDetails asset={asset} />
                    ) : (
                        <HistoricalPriceTable 
                        asset={asset}
                        historicalData={historicalData} 
                        isLoading={isLoading} 
                        />
                    )}
                </div>
            </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
