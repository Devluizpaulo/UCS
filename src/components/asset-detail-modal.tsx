

'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { AreaChart as AreaChartIcon, PieChart as PieChartIcon, Table as TableIcon, Loader2, List, Euro } from 'lucide-react';
import { Area, AreaChart, Brush, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CommodityPriceData, ChartData, FirestoreQuote } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getCotacoesHistorico, getLatestQuoteWithComponents } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AssetDetailModalProps {
    asset: CommodityPriceData;
    icon: React.ElementType;
    isOpen: boolean;
    onClose: () => void;
}

interface PieChartDataItem {
    name: string;
    value: number;
    fill: string;
}

const PIE_CHART_COLORS: Record<string, string> = {
    'Boi Gordo': 'hsl(var(--chart-1))',
    'Milho': 'hsl(var(--chart-2))',
    'Soja': 'hsl(var(--chart-3))',
    'Madeira': 'hsl(var(--chart-4))',
    'Carbono': 'hsl(var(--chart-5))',
    'Custo da Água': 'hsl(var(--chart-1))',
};

export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [pieChartData, setPieChartData] = useState<PieChartDataItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedAbsoluteChange, setFormattedAbsoluteChange] = useState('');

    const getDetails = useCallback(async (currentAsset: CommodityPriceData) => {
        setLoading(true);
        setHistoricalData([]);
        setChartData([]);
        setPieChartData(null);

        try {
            const price = formatCurrency(asset.price, asset.currency, asset.id);
            const absChange = formatCurrency(Math.abs(asset.absoluteChange), asset.currency, asset.id);
            
            setFormattedPrice(price);
            setFormattedAbsoluteChange(absChange);

            if (currentAsset.isCalculated) {
                const latestData = await getLatestQuoteWithComponents(currentAsset.id);
                if (latestData) {
                    let components: PieChartDataItem[] = [];
                    if (latestData.rent_media_components && latestData.base_custo_agua) {
                         const rentMediaComponents = latestData.rent_media_components;
                         const colorKeys = Object.keys(PIE_CHART_COLORS);
                         let colorIndex = 0;
                         
                         const addComponent = (name: string, value: number) => {
                             if (value > 0) {
                                 const fill = PIE_CHART_COLORS[name] || colorKeys[colorIndex % colorKeys.length];
                                 components.push({ name, value, fill });
                                 colorIndex++;
                             }
                         };
                         
                         addComponent('Boi Gordo', (rentMediaComponents.boi_gordo || 0) * 0.35);
                         addComponent('Milho', (rentMediaComponents.milho || 0) * 0.30);
                         addComponent('Soja', (rentMediaComponents.soja || 0) * 0.35);
                         addComponent('Madeira', rentMediaComponents.madeira || 0);
                         addComponent('Carbono', rentMediaComponents.carbono || 0);
                         addComponent('Custo da Água', latestData.base_custo_agua || 0);

                    } else if (latestData.rent_media_components) {
                         components = Object.entries(latestData.rent_media_components).map(([key, value]) => ({
                            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            value: value,
                            fill: (PIE_CHART_COLORS as any)[key] || 'hsl(var(--muted))'
                        }));
                    } else if (latestData.base_ucs) {
                        components.push({ name: 'Base UCS', value: latestData.base_ucs, fill: PIE_CHART_COLORS['Boi Gordo'] });
                    }
                    setPieChartData(components.filter(c => c.value > 0));
                }
            }
            
            const history = await getCotacoesHistorico(currentAsset.id);
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

    const yAxisFormatter = (value: number) => formatCurrency(Number(value), asset.currency, asset.id);
    const tooltipFormatter = (value: any) => [formatCurrency(Number(value), asset.currency, asset.id), 'Cotação'];
    const pieTooltipFormatter = (value: number, name: string) => [formatCurrency(value, asset.currency, asset.id), name];

    const renderCompositionContent = () => {
        if (loading) {
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!pieChartData || pieChartData.length === 0) {
             return (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                    Dados de composição indisponíveis.
                </div>
            );
        }

        return (
            <Tabs defaultValue="chart" className="w-full h-full flex flex-col">
                <TabsList className="mx-auto">
                    <TabsTrigger value="chart"><PieChartIcon className="mr-2 h-4 w-4" />Gráfico</TabsTrigger>
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Composição</TabsTrigger>
                </TabsList>
                <TabsContent value="chart" className="flex-1 -mt-2">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        <ResponsiveContainer>
                            <PieChart>
                                <Tooltip 
                                    content={<ChartTooltipContent 
                                        formatter={pieTooltipFormatter} 
                                        nameKey="name" 
                                        hideIndicator
                                    />} 
                                />
                                <Pie
                                    data={pieChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={50}
                                    paddingAngle={2}
                                    labelLine={false}
                                    label={false}
                                >
                                    {pieChartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </TabsContent>
                <TabsContent value="list" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <UiTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Componente</TableHead>
                                    <TableHead className="text-right">Contribuição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pieChartData.map(item => (
                                    <TableRow key={item.name}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(item.value, asset.currency, asset.id)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </UiTable>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        );
    };
    
    const renderAreaChart = () => (
        <div className="flex-1 h-full w-full"> 
            {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : chartData.length < 2 ? (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                    Dados insuficientes para exibir o gráfico.
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
                                fill="url(#colorValueDesktop)" 
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
                                    <TableCell className="text-right font-mono text-primary text-xs sm:text-sm flex items-center justify-end gap-1">
                                        {asset.id === 'eur' && <Euro className="h-4 w-4" />}
                                        {formatCurrency(dataPoint.ultimo, asset.currency, asset.id)}
                                    </TableCell>
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

    const isCalculatedWithComposition = asset.isCalculated && pieChartData && pieChartData.length > 0;

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
                        Análise detalhada do ativo {asset.name}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="px-6 py-4 border-b flex-shrink-0">
                     <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="text-3xl sm:text-4xl font-bold text-primary flex items-center gap-2">
                             {asset.id === 'eur' && <Euro className="h-7 w-7" />}
                            {formattedPrice}
                        </span>
                        <div className={cn("flex items-baseline gap-2 text-base sm:text-lg font-semibold", asset.absoluteChange >= 0 ? "text-primary" : "text-destructive")}>
                            <span>{asset.absoluteChange >= 0 ? '+' : ''}{formattedAbsoluteChange}</span>
                            <span>({asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%)</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">Última atualização: {asset.lastUpdated}</span>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto,1fr] gap-x-6 gap-y-2 min-h-0">
                    <h3 className="font-semibold text-md flex items-center gap-2">
                        {isCalculatedWithComposition ? <PieChartIcon className="h-4 w-4 text-muted-foreground"/> : <AreaChartIcon className="h-4 w-4 text-muted-foreground"/>}
                        {isCalculatedWithComposition ? 'Composição do Valor' : 'Desempenho Histórico'}
                    </h3>
                    <h3 className="font-semibold text-md flex items-center gap-2">
                        <TableIcon className="h-4 w-4 text-muted-foreground"/>
                        Cotações Históricas
                    </h3>
                    <div className="h-80 min-h-0">
                        {isCalculatedWithComposition ? renderCompositionContent() : renderAreaChart()}
                    </div>
                     <div className="h-80 min-h-0">
                        {renderHistoryTable()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
