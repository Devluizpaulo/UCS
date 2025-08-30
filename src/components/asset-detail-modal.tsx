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
import type { CommodityPriceData, ChartData } from '@/lib/types';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { analyzeAsset } from '@/ai/flows/analyze-asset-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { generateRealisticHistoricalData } from '@/lib/utils';

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  icon: React.ElementType;
  isOpen: boolean;
  onClose: () => void;
}

export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const historicalData = generateRealisticHistoricalData(asset.price, 30, 0.1, 'day');
    const latestValue = historicalData[historicalData.length-1].value;
    const [analysis, setAnalysis] = useState('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);


    useEffect(() => {
        if (isOpen) {
            const getAnalysis = async () => {
                setLoadingAnalysis(true);
                setAnalysis('');
                try {
                    const result = await analyzeAsset({ 
                        assetName: asset.name, 
                        historicalData: historicalData.map(d => d.value) 
                    });
                    setAnalysis(result.analysis);
                } catch (error) {
                    console.error("Failed to get AI analysis:", error);
                    setAnalysis("Não foi possível carregar a análise de IA no momento.");
                } finally {
                    setLoadingAnalysis(false);
                }
            };
            getAnalysis();
        }
    }, [isOpen, asset.name]);


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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
                <div>
                    <span className="text-4xl font-bold text-primary">R$ {latestValue.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground"> (preço atual)</span>
                </div>
                
                <div className="rounded-lg border bg-card/50 p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Análise de IA
                    </h3>
                    {loadingAnalysis ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analisando os dados...</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                        {analysis}
                        </p>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Histórico de Preços (Últimos 30 dias)</h3>
                    <ChartContainer config={{
                        value: { label: 'Valor', color: 'hsl(var(--primary))' },
                    }} className="h-[200px] w-full">
                        <AreaChart accessibilityLayer data={historicalData} margin={{ left: 0, right: 12, top: 10, bottom: 10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Area dataKey="value" type="natural" fill="var(--color-value)" fillOpacity={0.4} stroke="var(--color-value)" />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </div>

            {/* Right Column */}
            <div>
                 <h3 className="text-lg font-semibold mb-4">Cotações Diárias</h3>
                 <ScrollArea className="h-[400px] border rounded-md">
                     <Table>
                        <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm">
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Valor (BRL)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historicalData.slice().reverse().map((dataPoint) => (
                                <TableRow key={dataPoint.time}>
                                    <TableCell>{dataPoint.time}</TableCell>
                                    <TableCell className="text-right font-mono">R$ {dataPoint.value.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                 </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
