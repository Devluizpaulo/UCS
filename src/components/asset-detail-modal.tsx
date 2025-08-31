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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { getAssetAnalysis, getAssetHistoricalData } from '@/lib/data-service';

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  icon: React.ElementType;
  isOpen: boolean;
  onClose: () => void;
}

export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const getDetails = async () => {
                setLoading(true);
                setAnalysis('');
                setHistoricalData([]);

                try {
                    // Fetch real historical data from Firestore
                    const history = await getAssetHistoricalData(asset.name);
                    setHistoricalData(history);
                    
                    if (history.length > 0) {
                        const result = await getAssetAnalysis(
                            asset.name, 
                            history.map(d => d.value) 
                        );
                        setAnalysis(result.analysis);
                    } else {
                        setAnalysis("Não há dados históricos suficientes para gerar uma análise.");
                    }

                } catch (error) {
                    console.error("Failed to get asset details:", error);
                    setAnalysis("Não foi possível carregar a análise ou o histórico no momento.");
                } finally {
                    setLoading(false);
                }
            };
            getDetails();
        }
    }, [isOpen, asset.name]);

    const latestValue = historicalData.length > 0 ? historicalData[historicalData.length-1].value : asset.price;

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
                
                <div className="rounded-lg border bg-card/50 p-4 min-h-[120px]">
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Análise de IA
                    </h3>
                    {loading ? (
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
                    {loading ? (
                         <div className="h-[200px] w-full flex items-center justify-center rounded-md border">
                            <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
                         </div>
                    ) : (
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
                    )}
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
                            {loading ? (
                                Array.from({length: 10}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-5 w-20 bg-muted rounded-md animate-pulse"/></TableCell>
                                        <TableCell className="text-right"><div className="h-5 w-24 bg-muted rounded-md animate-pulse ml-auto"/></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                historicalData.slice().reverse().map((dataPoint) => (
                                    <TableRow key={dataPoint.time}>
                                        <TableCell>{dataPoint.time}</TableCell>
                                        <TableCell className="text-right font-mono">R$ {dataPoint.value.toFixed(2)}</TableCell>
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
