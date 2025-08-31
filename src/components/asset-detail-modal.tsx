'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { CommodityPriceData, ChartData, HistoricalQuote, AnalyzeAssetOutput } from '@/lib/types';
import { Lightbulb, Loader2, Link as LinkIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getAssetAnalysis, getAssetHistoricalData } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  icon: React.ElementType;
  isOpen: boolean;
  onClose: () => void;
}

export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<HistoricalQuote[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeAssetOutput | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const getDetails = async () => {
                setLoading(true);
                setAnalysisResult(null);
                setHistoricalData([]);
                setChartData([]);

                try {
                    const history = await getAssetHistoricalData(asset.name);
                    setHistoricalData(history);
                    
                    const chartPoints = history.map(d => ({ time: d.date, value: d.close }));
                    setChartData(chartPoints);
                    
                    if (history.length > 0) {
                        const result = await getAssetAnalysis(
                            asset.name, 
                            history.map(d => d.close) 
                        );
                        setAnalysisResult(result);
                    } else {
                        setAnalysisResult({ analysis: "Não há dados históricos suficientes para gerar uma análise.", sources: [] });
                    }

                } catch (error) {
                    console.error("Failed to get asset details:", error);
                    setAnalysisResult({ analysis: "Não foi possível carregar a análise ou o histórico no momento.", sources: [] });
                } finally {
                    setLoading(false);
                }
            };
            getDetails();
        }
    }, [isOpen, asset.name]);

    const latestPrice = historicalData.length > 0 ? historicalData[historicalData.length-1].close : asset.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <span>{asset.name}</span>
          </DialogTitle>
          <DialogDescription>
            Análise detalhada do histórico de preços e tendências para {asset.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-4">
            {/* Left Column */}
            <div className="md:col-span-3 flex flex-col gap-6">
                <div>
                    <span className="text-4xl font-bold text-primary">R$ {latestPrice.toFixed(4)}</span>
                    <span className="text-sm text-muted-foreground"> (preço atual)</span>
                </div>
                
                <div className="rounded-lg border bg-card/50 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Análise de IA
                    </h3>
                    {loading || !analysisResult ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analisando os dados...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {analysisResult.analysis}
                            </p>
                            {analysisResult.sources.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-sm mb-2">Fontes de Referência:</h4>
                                    <ul className="space-y-2">
                                        {analysisResult.sources.map(source => (
                                            <li key={source.url} className="flex items-start gap-2">
                                                <LinkIcon className="h-4 w-4 text-muted-foreground/80 mt-1 shrink-0" />
                                                <Link href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                                    {source.title} ({source.source})
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Histórico de Preços (Últimos 30 dias)</h3>
                    {loading ? (
                         <div className="h-[200px] w-full flex items-center justify-center rounded-md border">
                            <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
                         </div>
                    ) : (
                        <ChartContainer config={{
                            value: { label: 'Valor', color: 'hsl(var(--primary))' },
                        }} className="h-[200px] w-full">
                            <AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Area dataKey="value" type="natural" fill="var(--color-value)" fillOpacity={0.4} stroke="var(--color-value)" />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2">
                 <h3 className="text-lg font-semibold mb-4">Cotações Diárias</h3>
                 <ScrollArea className="h-[450px] border rounded-md">
                     <Table>
                        <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                            <TableRow>
                                <TableHead className="w-[80px]">Data</TableHead>
                                <TableHead className="text-right">Fechamento</TableHead>
                                <TableHead className="text-right">Abertura</TableHead>
                                <TableHead className="text-right">Máxima</TableHead>
                                <TableHead className="text-right">Mínima</TableHead>
                                <TableHead className="text-right w-[90px]">Variação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({length: 10}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-5 w-16 bg-muted rounded-md animate-pulse"/></TableCell>
                                        <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                        <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                        <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                        <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                        <TableCell><div className="h-5 w-16 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                historicalData.slice().reverse().map((dataPoint) => (
                                    <TableRow key={dataPoint.date}>
                                        <TableCell className="font-medium text-xs">{dataPoint.date}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">R$ {dataPoint.close.toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{dataPoint.open.toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{dataPoint.high.toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{dataPoint.low.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold font-mono transition-colors",
                                                dataPoint.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                                            )}>
                                                {dataPoint.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                                                {dataPoint.change.toFixed(2)}%
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                     </Table>
                 </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
