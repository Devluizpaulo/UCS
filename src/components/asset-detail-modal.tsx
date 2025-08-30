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

interface AssetDetailModalProps {
  asset: CommodityPriceData;
  icon: React.ElementType;
  isOpen: boolean;
  onClose: () => void;
}

// Generate mock historical data for the chart
const generateHistoricalData = (baseValue: number): ChartData[] => {
  const data: ChartData[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // Last 30 days
    data.push({
      time: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: baseValue * (1 + (Math.random() - 0.5) * 0.1), // Fluctuate up to 10%
    });
  }
  return data;
};


export function AssetDetailModal({ asset, icon: Icon, isOpen, onClose }: AssetDetailModalProps) {
    const historicalData = generateHistoricalData(asset.price);
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
    }, [isOpen, asset.name, asset.price]); // Re-run when modal opens or asset changes


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
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
        <div className="grid gap-6 py-4">
            <div className="mb-4">
                <span className="text-4xl font-bold text-primary">R$ {latestValue.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground"> (preço atual)</span>
            </div>

            <h3 className="text-lg font-semibold">Histórico de Preços (Últimos 30 dias)</h3>
            <ChartContainer config={{
                value: {
                label: 'Valor',
                color: 'hsl(var(--primary))',
                },
            }}
            className="h-[250px] w-full"
            >
            <AreaChart accessibilityLayer data={historicalData} margin={{ left: 12, right: 12, top:10, bottom: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                />
                <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                dataKey="value"
                type="natural"
                fill="var(--color-value)"
                fillOpacity={0.4}
                stroke="var(--color-value)"
                />
            </AreaChart>
            </ChartContainer>

             <div className="mt-4 rounded-lg border bg-card/50 p-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
