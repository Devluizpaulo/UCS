
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
import { format } from 'date-fns';

import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';
import { getCotacoesHistorico } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Ch2oDetails } from './ch2o-details';
import { HistoricalPriceTable } from './historical-price-table';

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AssetDetailModal({ asset, isOpen, onOpenChange }: AssetDetailModalProps) {
  const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen && asset.id !== 'agua') {
      setIsLoading(true);
      getCotacoesHistorico(asset.id)
        .then((data) => {
          setHistoricalData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setHistoricalData([]);
          setIsLoading(false);
        });
    } else if (asset.id === 'agua') {
      // O componente Ch2oDetails cuida do seu próprio fetch e estado de loading.
      setIsLoading(false);
    }
  }, [asset.id, isOpen]);

  const chartData = useMemo(() => {
    // Para o CH2O, o gráfico usará os dados de histórico que são buscados separadamente.
    // Para outros ativos, usamos os dados do estado.
    const sourceData = asset.id === 'agua' ? historicalData : historicalData;

    return sourceData
      .slice(0, 30) // Use last 30 days for chart
      .map((quote) => ({
        date: format(new Date(quote.timestamp), 'dd/MM'),
        price: quote.ultimo,
      }))
      .reverse(); // Ensure chronological order for the chart
  }, [historicalData, asset.id]);

  const Icon = getIconForCategory(asset);
  const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
  const ChangeIcon = asset.change >= 0 ? ArrowUp : ArrowDown;
  
  // Efeito para buscar os dados de histórico para o gráfico do CH2O
  useEffect(() => {
    if (isOpen && asset.id === 'agua') {
      getCotacoesHistorico('agua').then(setHistoricalData);
    }
  }, [isOpen, asset.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full p-0">
        <div className="grid md:grid-cols-[300px_1fr] h-full max-h-[90vh]">
          {/* ASSET INFO SIDEBAR */}
          <div className="bg-muted/50 p-6 flex flex-col gap-6 border-r">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <DialogTitle className="text-xl font-bold">{asset.name}</DialogTitle>
              </div>
              <DialogDescription>{asset.description}</DialogDescription>
            </DialogHeader>

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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Moeda:</span>
                  <span>{asset.currency}</span>
                </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="grid gap-6">
                {/* CHART */}
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Preços (Últimos 30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    {(isLoading || (asset.id === 'agua' && historicalData.length === 0)) ? (
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
                 {asset.id === 'agua' ? (
                  <Ch2oDetails />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
