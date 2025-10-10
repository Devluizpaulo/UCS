
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import type { FirestoreQuote, CommodityConfig } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Info, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { AssetInfo } from './asset-detail-modal';
import { PdfExportButton } from './pdf-export-button';
import { Button } from './ui/button';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const UCS_ASE_COMPARISON_ASSETS = ['ucs_ase', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
type TimeRange = '1d' | '7d' | '30d' | '1y' | 'all';

const timeRangeInDays: Record<TimeRange, number> = {
  '1d': 2,
  '7d': 7,
  '30d': 30,
  '1y': 365,
  'all': 3650,
};

const lineColors: { [key: string]: string } = {
  ucs_ase: 'hsl(var(--chart-1))',
  soja: 'hsl(var(--chart-2))',
  milho: 'hsl(var(--chart-3))',
  boi_gordo: 'hsl(var(--chart-4))',
  madeira: 'hsl(var(--chart-5))',
  carbono: 'hsl(220, 70%, 50%)',
};

const getPriceFromQuote = (quote: FirestoreQuote, assetId: string) => {
    if (!quote) return undefined;
    if (assetId === 'ucs_ase') {
        const value = quote.valor_brl ?? quote.resultado_final_brl;
        return typeof value === 'number' ? value : undefined;
    }
    const value = quote.valor ?? quote.ultimo;
    return typeof value === 'number' ? value : undefined;
};


const LegendContent = ({ assets, visibleAssets, onVisibilityChange, lineColors }: { assets: CommodityConfig[], visibleAssets: Record<string, boolean>, onVisibilityChange: (id: string) => void, lineColors: Record<string, string> }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Ativos no Gráfico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {UCS_ASE_COMPARISON_ASSETS.map(id => {
          const assetName = assets.find(a => a.id === id)?.name || id.toUpperCase();
          const color = lineColors[id];
          return (
            <div key={id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={visibleAssets[id]}
                onCheckedChange={() => onVisibilityChange(id)}
                style={{borderColor: color}}
              />
              <Label htmlFor={id} className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                 {assetName}
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
);

export function HistoricalAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<Record<string, FirestoreQuote[]>>({});
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getCommodityConfigs().then(setAssets);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Sempre busca os dados para a comparação, simplificando a lógica
    const assetsToFetch = UCS_ASE_COMPARISON_ASSETS;
    const daysToFetch = timeRangeInDays[timeRange];
    
    Promise.all(assetsToFetch.map(id => getCotacoesHistorico(id, daysToFetch)))
      .then((histories) => {
        const newData: Record<string, FirestoreQuote[]> = {};
        histories.forEach((history, index) => {
          newData[assetsToFetch[index]] = history;
        });
        setData(newData);
        setVisibleAssets(
            assetsToFetch.reduce((acc, id) => ({ ...acc, [id]: true }), {})
        );
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching historical data:", err);
        setData({});
        setIsLoading(false);
      });
  }, [timeRange]); // A busca de dados não depende mais do ativo selecionado

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);
  
  const { chartData, mainAssetData, isMultiLine } = useMemo(() => {
    if (Object.keys(data).length === 0 || !selectedAssetConfig) {
      return { chartData: [], mainAssetData: null, isMultiLine: false };
    }

    const mainHistory = data[selectedAssetId] || [];
    const sortedData = [...mainHistory].sort((a, b) => (new Date(b.timestamp as any)).getTime() - (new Date(a.timestamp as any)).getTime());
    const quoteForDate = sortedData.find(q => format(new Date(q.timestamp as any), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')) || sortedData[0];
    
    if (!quoteForDate) {
       return { chartData: [], mainAssetData: null, isMultiLine: false };
    }

    const isMulti = selectedAssetId === 'ucs_ase';
    let finalChartData: any[];

    if (isMulti) {
        const dataMap = new Map<string, any>();
        UCS_ASE_COMPARISON_ASSETS.forEach(id => {
            const assetHistory = data[id] || [];
            assetHistory.forEach(quote => {
                if(!quote || !quote.timestamp) return;
                const date = new Date(quote.timestamp as any);
                const dateStr = format(date, 'yyyy-MM-dd'); // Usar chave única
                if (!dataMap.has(dateStr)) {
                    dataMap.set(dateStr, { date: format(date, 'dd/MM'), timestamp: date.getTime() });
                }
                const value = getPriceFromQuote(quote, id);
                if(value !== undefined) {
                    dataMap.get(dateStr)[id] = value;
                }
            });
        });
        finalChartData = Array.from(dataMap.values()).sort((a,b) => a.timestamp - b.timestamp);
    } else {
        finalChartData = sortedData
            .map(quote => {
                if(!quote || !quote.timestamp) return null;
                return {
                    date: format(new Date(quote.timestamp as any), 'dd/MM'),
                    value: getPriceFromQuote(quote, selectedAssetId),
                }
            })
            .filter(item => item && item.value !== undefined)
            .reverse();
    }
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: isForexAsset ? (quoteForDate.ultimo ?? 0) : getPriceFromQuote(quoteForDate, selectedAssetId) ?? 0,
        currency: isForexAsset ? selectedAssetConfig.currency : 'BRL',
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (quoteForDate.ultimo ?? 0) - (quoteForDate.fechamento_anterior ?? (quoteForDate.ultimo ?? 0)),
        lastUpdated: quoteForDate.data || format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy'),
    };

    return { chartData: finalChartData, mainAssetData: mainAsset, isMultiLine: isMulti };
  }, [data, targetDate, selectedAssetConfig, selectedAssetId]);
  
  const handleVisibilityChange = (assetId: string) => {
    setVisibleAssets(prev => ({
        ...prev,
        [assetId]: !prev[assetId],
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b">
          <div className="flex-1">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Selecione um ativo" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                  <Button variant={timeRange === '1d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('1d')} className="h-8">1D</Button>
                  <Button variant={timeRange === '7d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('7d')} className="h-8">7D</Button>
                  <Button variant={timeRange === '30d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('30d')} className="h-8">30D</Button>
                  <Button variant={timeRange === '1y' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('1y')} className="h-8">1A</Button>
                  <Button variant={timeRange === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('all')} className="h-8">Tudo</Button>
              </div>
              <PdfExportButton
                  data={{ 
                      mainIndex: mainAssetData || undefined,
                      secondaryIndices: [],
                      currencies: [],
                      otherAssets: [],
                      targetDate,
                  }}
                  reportType="asset-detail"
                  disabled={isLoading || chartData.length === 0}
              />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 p-4">
          {mainAssetData ? <AssetInfo asset={mainAssetData} /> : <Skeleton className="h-24 w-full" />}
          
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 h-96 bg-background rounded-lg p-4 border">
                    <HistoricalAnalysisChart 
                        isLoading={isLoading}
                        chartData={chartData}
                        isMultiLine={isMultiLine}
                        mainAssetData={mainAssetData}
                        visibleAssets={visibleAssets}
                        lineColors={lineColors}
                    />
                </div>

                 {isMultiLine && (
                    <div className="lg:col-span-1">
                        <LegendContent 
                            assets={assets}
                            visibleAssets={visibleAssets}
                            onVisibilityChange={handleVisibilityChange}
                            lineColors={lineColors}
                        />
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </>
  );
}
