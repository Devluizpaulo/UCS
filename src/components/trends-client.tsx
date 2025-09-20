
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { addDays, format as formatDate } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Area, AreaChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CommodityConfig, ChartData, CommodityPriceData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from './ui/date-range-picker';
import { ChartContainer, ChartTooltipContent } from './ui/chart';
import { getIconForCategory } from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface TrendsClientProps {
  availableAssets: CommodityConfig[];
}

export function TrendsClient({ availableAssets }: TrendsClientProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const selectedAsset = useMemo(() => 
    availableAssets.find(a => a.id === selectedAssetId), 
    [selectedAssetId, availableAssets]
  );

  const fetchData = useCallback(async (assetId: string, range?: DateRange) => {
    setLoading(true);
    try {
        const query = new URLSearchParams({ assetId });
        if (range?.from) query.append('from', range.from.toISOString());
        if (range?.to) query.append('to', range.to.toISOString());

        // We will fetch all data and filter on client, as firestore doesn't support complex range queries easily
        const response = await fetch(`/api/cotacoes-historico?assetId=${assetId}&limit=365`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        
        const filteredData = data.filter((d: any) => {
            const dDate = new Date(d.timestamp);
            const fromOk = !range?.from || dDate >= range.from;
            const toOk = !range?.to || dDate <= addDays(range.to, 1); // include the 'to' date
            return fromOk && toOk;
        });

        const formattedData = filteredData
            .map((d: any) => ({
                time: formatDate(new Date(d.timestamp), 'dd/MM/yy'),
                value: d.ultimo
            }))
            .sort((a: ChartData, b: ChartData) => new Date(a.time.split('/').reverse().join('-')).getTime() - new Date(b.time.split('/').reverse().join('-')).getTime());

        setChartData(formattedData);
    } catch (error) {
        console.error("Error fetching historical data:", error);
        setChartData([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedAssetId, dateRange);
  }, [selectedAssetId, dateRange, fetchData]);

  if (!selectedAsset) return null;

  const chartConfig = {
    value: {
      label: selectedAsset.name,
      color: 'hsl(var(--primary))',
    },
  };

  const yAxisFormatter = (value: number) => formatCurrency(Number(value), selectedAsset.currency, selectedAsset.id);
  const tooltipFormatter = (value: any) => [formatCurrency(Number(value), selectedAsset.currency, selectedAsset.id), 'Cotação'];
  
  const renderChart = () => {
    if (loading) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    if (chartData.length < 2) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                Dados insuficientes para exibir o gráfico no período selecionado.
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 5, right: 20, top: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                        width={80}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={yAxisFormatter}
                    />
                    <Tooltip 
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                        content={<ChartTooltipContent 
                            indicator="dot" 
                            formatter={tooltipFormatter} 
                            labelFormatter={(label: string) => `Data: ${label}`}
                        />} 
                    />
                    <Area 
                        dataKey="value" 
                        type="monotone" 
                        fill="url(#colorValue)" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                    />
                    <Brush 
                        dataKey="time" 
                        height={25} 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--background))"
                        travellerWidth={10}
                        tickFormatter={(index) => chartData[index]?.time || ''}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
  }

  const getIconForAssetConfig = (assetConfig: CommodityConfig) => {
    // Create a mock CommodityPriceData object for the icon function
    const mockAsset: CommodityPriceData = {
        ...assetConfig,
        price: 0,
        change: 0,
        absoluteChange: 0,
        lastUpdated: ''
    };
    return getIconForCategory(mockAsset);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Gráfico de Desempenho Histórico</CardTitle>
                <CardDescription>
                    Selecione um ativo e um período para visualizar sua performance ao longo do tempo.
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Selecione um ativo" />
                </SelectTrigger>
                <SelectContent>
                    {availableAssets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                        <div className="flex items-center gap-2">
                            {React.createElement(getIconForAssetConfig(asset), { className: 'h-4 w-4' })}
                            {asset.name}
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
