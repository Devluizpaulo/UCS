

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isValid, subDays, parse } from 'date-fns';
import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs, calculateFrequencyAwareMetrics } from '@/lib/data-service';
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
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Activity,
  BarChart,
  Table,
  RefreshCw,
  Loader2,
  CheckSquare
} from 'lucide-react';
import { Button } from './ui/button';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { AssetHistoricalTable } from './historical-price-table';
import { AssetDetailModal } from './asset-detail-modal';
import { PdfExportButton } from '@/components/pdf-export-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Lista de ativos disponíveis
const UCS_ASE_COMPARISON_ASSETS = ['ucs_ase', 'pdm', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
type TimeRange = '7d' | '30d' | '90d' | '1y' | '5y' | 'all';


const timeRangeInDays: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  '5y': 365 * 5,
  'all': 365 * 10, // 10 anos para "Tudo"
};

const lineColors: { [key: string]: string } = {
  ucs_ase: 'hsl(var(--chart-1))',
  soja: 'hsl(var(--chart-2))',
  milho: 'hsl(var(--chart-3))',
  boi_gordo: 'hsl(var(--chart-4))',
  madeira: 'hsl(var(--chart-5))',
  carbono: 'hsl(220, 70%, 50%)',
  pdm: 'hsl(var(--primary))',
};

// Função para extrair preço de uma cotação
const getPriceFromQuote = (quote: FirestoreQuote, assetId: string): number | undefined => {
  if (!quote) return undefined;
  
  // Prioriza o valor já convertido para BRL se existir
  if (quote.ultimo_brl) return quote.ultimo_brl;
  
  if (assetId === 'ucs_ase') {
    const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
    return typeof value === 'number' ? value : undefined;
  }
  
  const value = quote.valor ?? quote.ultimo;
  return typeof value === 'number' ? value : undefined;
};

// Componente principal melhorado
export function EnhancedTrendAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<Record<string, FirestoreQuote[]>>({});
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('pdm');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<Record<string, boolean>>({});
  const [selectedQuote, setSelectedQuote] = useState<FirestoreQuote | null>(null);

  useEffect(() => {
    getCommodityConfigs()
      .then(configs => {
        setAssets(configs);
      })
      .catch(error => {
        console.error('Erro ao carregar configurações:', error);
      });
  }, []);

  const isMultiLine = useMemo(() => selectedAssetId === 'ucs_ase', [selectedAssetId]);

  useEffect(() => {
    setIsLoading(true);
    const assetsToFetch = isMultiLine ? Array.from(new Set([selectedAssetId, ...UCS_ASE_COMPARISON_ASSETS])) : [selectedAssetId];
    const daysToFetch = timeRangeInDays[timeRange];
    
    console.log(`🔍 Fetching historical data for ${assetsToFetch.length} assets, ${daysToFetch} days`);
    
    Promise.all(assetsToFetch.map(async (id) => {
      console.log(`📊 Fetching data for ${id}...`);
      const history = await getCotacoesHistorico(id, daysToFetch);
      console.log(`📊 ${id}: ${history.length} records found`);
      return { id, history };
    }))
      .then((histories) => {
        const newData: Record<string, FirestoreQuote[]> = {};
        histories.forEach(({ id, history }) => {
          newData[id] = history;
        });
        
        // Log total data
        const totalRecords = Object.values(newData).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📈 Total records loaded: ${totalRecords}`);
        
        setData(newData);

        if (isMultiLine) {
            setVisibleAssets(
                assetsToFetch.reduce((acc, id) => ({ ...acc, [id]: true }), {})
            );
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching historical data:", err);
        setData({});
        setIsLoading(false);
      });
  }, [selectedAssetId, timeRange, isMultiLine]);


  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const currentData = useMemo(() => {
    return data[selectedAssetId] || [];
  }, [data, selectedAssetId]);
  
  const { chartData, mainAssetData, assetNames } = useMemo(() => {
    const names: Record<string, string> = {};
    assets.forEach(a => {
        names[a.id] = a.name;
    });

    if (Object.keys(data).length === 0 || !selectedAssetConfig) {
      return { chartData: [], mainAssetData: null, assetNames: names };
    }
  
    const mainHistory = data[selectedAssetId] || [];
    
    const sortedByDate = [...mainHistory].sort((a, b) => {
        let dateA: Date, dateB: Date;
        try {
            if (typeof a.data === 'string' && a.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                dateA = parse(a.data, 'dd/MM/yyyy', new Date());
            } else if (a.timestamp) {
                dateA = new Date(a.timestamp as any);
            } else {
                return 1;
            }
        } catch {
            return 1;
        }

        try {
            if (typeof b.data === 'string' && b.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                dateB = parse(b.data, 'dd/MM/yyyy', new Date());
            } else if (b.timestamp) {
                dateB = new Date(b.timestamp as any);
            } else {
                return -1;
            }
        } catch {
            return -1;
        }
        
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        return dateB.getTime() - dateA.getTime();
    });

    const quoteForDate = sortedByDate[0];
    
    if (!quoteForDate) {
       return { chartData: [], mainAssetData: null, assetNames: names };
    }

    let finalChartData: any[];
    const cutoffDate = subDays(new Date(), timeRangeInDays[timeRange]);

    if (isMultiLine) {
        const dataMap = new Map<string, any>();
        
        const assetsToProcess = Array.from(new Set([selectedAssetId, ...UCS_ASE_COMPARISON_ASSETS]));

        assetsToProcess.forEach(id => {
            const assetHistory = data[id] || [];
            assetHistory.forEach(quote => {
                if(!quote) return;
                try {
                  let date: Date;
                   if (typeof quote.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(quote.data)) {
                    date = parse(quote.data, 'dd/MM/yyyy', new Date());
                  } else {
                    date = new Date(quote.timestamp as any);
                  }
                  
                  if(!isValid(date) || date < cutoffDate) return;

                  const dateStr = format(date, 'yyyy-MM-dd');
                  if (!dataMap.has(dateStr)) {
                      dataMap.set(dateStr, { date: format(date, 'dd/MM/yy'), timestamp: date.getTime() });
                  }
                  const value = getPriceFromQuote(quote, id);
                  if(value !== undefined) {
                      dataMap.get(dateStr)[id] = value;
                  }
                } catch {}
            });
        });
        
        finalChartData = Array.from(dataMap.values()).sort((a,b) => a.timestamp - b.timestamp);
    } else {
        const dateFormat = timeRange === '1y' || timeRange === '5y' || timeRange === 'all' ? 'MM/yy' : 'dd/MM/yy';
        finalChartData = sortedByDate
            .map(quote => {
                if(!quote) return null;
                 try {
                    let date: Date;
                    if (typeof quote.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(quote.data)) {
                        date = parse(quote.data, 'dd/MM/yyyy', new Date());
                    } else if (quote.timestamp) {
                        date = new Date(quote.timestamp as any);
                    } else {
                        return null;
                    }
                    
                    if(!isValid(date) || date < cutoffDate) return null;
                    const price = getPriceFromQuote(quote, selectedAssetId);
                    return {
                        date: format(date, dateFormat),
                        value: price,
                    }
                } catch { return null; }
            })
            .filter((item): item is NonNullable<typeof item>  => item !== null && item.value !== undefined)
            .reverse();
    }
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...(selectedAssetConfig as CommodityConfig),
        price: isForexAsset ? (quoteForDate.ultimo_brl ?? 0) : getPriceFromQuote(quoteForDate, selectedAssetId) ?? 0,
        currency: 'BRL', // Mostra sempre BRL
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (getPriceFromQuote(quoteForDate as FirestoreQuote, selectedAssetId) ?? 0) - (getPriceFromQuote(quoteForDate.fechamento_anterior_quote, selectedAssetId) ?? (getPriceFromQuote(quoteForDate as FirestoreQuote, selectedAssetId) ?? 0)),
        lastUpdated: (typeof quoteForDate.data === 'string' ? quoteForDate.data : (quoteForDate.timestamp ? format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy') : 'N/A')),
    };
    
    return { chartData: finalChartData, mainAssetData: mainAsset, assetNames: names };
  }, [data, targetDate, selectedAssetConfig, selectedAssetId, assets, timeRange, isMultiLine]);
  
  const handleVisibilityChange = (assetId: string) => {
    setVisibleAssets(prev => ({
        ...prev,
        [assetId]: !prev[assetId],
    }));
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
                  <Button variant={timeRange === '7d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('7d')} className="h-8">7D</Button>
                  <Button variant={timeRange === '30d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('30d')} className="h-8">30D</Button>
                  <Button variant={timeRange === '90d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('90d')} className="h-8">90D</Button>
                  <Button variant={timeRange === '1y' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('1y')} className="h-8">1A</Button>
                  <Button variant={timeRange === '5y' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('5y')} className="h-8">5A</Button>
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
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Visão Geral e Gráfico</TabsTrigger>
                <TabsTrigger value="data">Dados Históricos</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <CardContent className="flex flex-col gap-8 p-4">
                  {mainAssetData ? <AssetInfo asset={mainAssetData} /> : <Skeleton className="h-24 w-full" />}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className={`h-96 bg-background rounded-lg p-4 border ${isMultiLine ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                            <HistoricalAnalysisChart 
                                isLoading={isLoading}
                                chartData={chartData}
                                isMultiLine={isMultiLine}
                                mainAssetData={mainAssetData}
                                visibleAssets={visibleAssets}
                                lineColors={lineColors}
                                assetNames={assetNames}
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
            </TabsContent>
            <TabsContent value="data">
                 <CardContent className="p-4">
                    <AssetHistoricalTable
                        assetId={selectedAssetId}
                        data={currentData}
                        assetConfig={mainAssetData || undefined}
                        isLoading={isLoading}
                        onRowClick={(quote) => setSelectedQuote(quote)}
                    />
                 </CardContent>
            </TabsContent>
        </Tabs>
      </Card>
      {selectedQuote && mainAssetData && (
        <AssetDetailModal
          asset={{ ...mainAssetData, price: getPriceFromQuote(selectedQuote, selectedAssetId) || 0, change: selectedQuote.variacao_pct || 0, absoluteChange: 0, lastUpdated: '' }}
          isOpen={!!selectedQuote}
          onOpenChange={(isOpen) => !isOpen && setSelectedQuote(null)}
        />
      )}
    </>
  );
}


const AssetInfo = ({ asset }: { asset: CommodityPriceData }) => {
    if (!asset) return null;
  
    const changeColor = asset.change >= 0 ? 'text-green-600' : 'text-red-600';
    const ChangeIcon = asset.change >= 0 ? TrendingUp : TrendingDown;
  
    return (
      <div className="space-y-1 p-2 rounded-lg bg-muted/50">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </span>
            <span className="text-sm text-muted-foreground">{asset.currency}</span>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${changeColor}`}>
            <ChangeIcon className="h-4 w-4" />
            <span>{asset.change.toFixed(2)}%</span>
            <span className="text-xs font-normal text-muted-foreground">({formatCurrency(asset.absoluteChange, asset.currency, asset.id)})</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Última atualização em {asset.lastUpdated}
        </p>
      </div>
    );
};
