

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Activity,
  DollarSign,
  Percent,
  Target,
  BarChart,
  Table,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  LineChart as LineChartIcon,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdvancedPerformanceChart } from './charts/advanced-performance-chart';
import { PdfExportButton } from '@/components/pdf-export-button';
import { AssetHistoricalTable } from './historical-price-table';
import { AssetDetailModal } from './asset-detail-modal';

// Lista de ativos disponíveis
const UCS_ASE_COMPARISON_ASSETS = ['PDM', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
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
  PDM: 'hsl(var(--primary))',
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

// Componente de métricas de performance
const PerformanceMetrics = ({ 
  assetId, 
  data, 
  isLoading 
}: { 
  assetId: string; 
  data: FirestoreQuote[]; 
  isLoading: boolean;
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const calculateMetrics = async () => {
      if (!data || data.length === 0) {
        setMetrics(null);
        return;
      }
      
      setIsCalculating(true);
      try {
        const analysis = await calculateFrequencyAwareMetrics(data, assetId);
        setMetrics(analysis.metrics);
      } catch (error) {
        console.error('Erro ao calcular métricas:', error);
        setMetrics(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateMetrics();
  }, [data, assetId]);

  if (isLoading || isCalculating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Calculando métricas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Dados insuficientes para calcular métricas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Métricas de Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-green-700">Retorno Total</p>
            <p className="text-2xl font-bold text-green-800">
              {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Volatilidade</p>
            <p className="text-2xl font-bold text-blue-800">
              {metrics.volatility.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-sm font-medium text-red-700">Max Drawdown</p>
            <p className="text-2xl font-bold text-red-800">
              {metrics.maxDrawdown.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium text-purple-700">Sharpe Ratio</p>
            <p className="text-2xl font-bold text-purple-800">
              {metrics.sharpeRatio.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Preço Atual</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.currentPrice, 'BRL', selectedAssetId)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Máximo</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.high, 'BRL', selectedAssetId)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Mínimo</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.low, 'BRL', selectedAssetId)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal melhorado
export function EnhancedTrendAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<Record<string, FirestoreQuote[]>>({});
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('PDM');
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

  useEffect(() => {
    setIsLoading(true);
    const daysToFetch = timeRangeInDays[timeRange];
    
    getCotacoesHistorico(selectedAssetId, daysToFetch)
      .then(history => {
        setData({ [selectedAssetId]: history });
        setIsLoading(false);
      })
      .catch(error => {
        console.error(`Erro ao buscar dados para ${selectedAssetId}:`, error);
        setData({});
        setIsLoading(false);
      });
  }, [selectedAssetId, timeRange]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const currentData = useMemo(() => {
    return data[selectedAssetId] || [];
  }, [data, selectedAssetId]);
  
  const { chartData, mainAssetData, isMultiLine, assetNames } = useMemo(() => {
    if (!selectedAssetConfig) {
      return { chartData: [], mainAssetData: null, isMultiLine: false, assetNames: {} };
    }
  
    const names: Record<string, string> = {};
    assets.forEach(a => {
        names[a.id] = a.name;
    });

    const processData = (history: FirestoreQuote[], assetId: string, range: TimeRange) => {
        const dateFormat = range === '1y' || range === '5y' || range === 'all' ? 'MM/yy' : 'dd/MM/yy';
        
        const cutoffDate = subDays(new Date(), timeRangeInDays[range]);

        const filteredHistory = history.filter(quote => {
            if (!quote) return false;
            try {
                let date: Date;
                if (typeof quote.data === 'string' && quote.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    date = parse(quote.data, 'dd/MM/yyyy', new Date());
                } else if (quote.timestamp) {
                    date = new Date(quote.timestamp as any);
                } else {
                    return false;
                }
                return isValid(date) && date >= cutoffDate;
            } catch {
                return false;
            }
        });

      return filteredHistory
        .map(quote => {
          let date: Date | null = null;
            if (typeof quote.data === 'string' && quote.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                date = parse(quote.data, 'dd/MM/yyyy', new Date());
            } else if (quote.timestamp) {
                date = new Date(quote.timestamp as any);
            }
          if (!date || !isValid(date)) return null;

          const price = getPriceFromQuote(quote, assetId);
          if (price === undefined) return null;
  
          return {
            date: format(date, dateFormat),
            value: price,
            timestamp: date.getTime(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
    };
  
    const processedChartData = processData(currentData, selectedAssetId, timeRange);
    
    const sortedByDate = [...currentData].sort((a, b) => {
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

    const quoteForDate = sortedByDate.find(q => {
        if (!q) return false;
        try {
            let quoteDate: Date;
            if (typeof q.data === 'string' && q.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                quoteDate = parse(q.data, 'dd/MM/yyyy', new Date());
            } else if(q.timestamp) {
                quoteDate = new Date(q.timestamp as any);
            } else {
                return false;
            }
            // Procurar a cotação mais recente ANTERIOR ou IGUAL à data alvo
            return isValid(quoteDate) && quoteDate <= targetDate;
        } catch { return false; }
    }) || sortedByDate[0];
    
    if (!quoteForDate) {
       return { chartData: [], mainAssetData: null, isMultiLine: false, assetNames: names };
    }

    const isMulti = selectedAssetId === 'PDM' || selectedAssetId === 'ucs_ase';
    let finalChartData: any[];

    const cutoffDate = subDays(new Date(), timeRangeInDays[timeRange]);

    if (isMulti) {
        const dataMap = new Map<string, any>();
        
        if (selectedAssetId === 'PDM') {
            const pdmHistory = data['PDM'] || [];
            pdmHistory.forEach(quote => {
                if(!quote || !quote.componentes) return;
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
                  
                  Object.entries(quote.componentes).forEach(([key, value]) => {
                      if (typeof value === 'number' && value > 0) {
                          dataMap.get(dateStr)[key] = value;
                      }
                  });
                } catch {}
            });
        } else {
            UCS_ASE_COMPARISON_ASSETS.forEach(id => {
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
        }
        
        finalChartData = Array.from(dataMap.values()).sort((a,b) => a.timestamp - b.timestamp);
    } else {
        finalChartData = processedChartData;
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
    
    return { chartData: finalChartData, mainAssetData: mainAsset, isMultiLine: isMulti, assetNames: names };
  }, [currentData, selectedAssetId, assets, selectedAssetConfig, targetDate, timeRange]);
  
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
                        <div className="lg:col-span-4 h-96 bg-background rounded-lg p-4 border">
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
                    </div>
                </CardContent>
            </TabsContent>
            <TabsContent value="data">
                 <CardContent className="p-4">
                    <AssetHistoricalTable
                        assetId={selectedAssetId}
                        data={currentData}
                        assetConfig={selectedAssetConfig}
                        isLoading={isLoading}
                        onRowClick={(quote) => setSelectedQuote(quote)}
                    />
                 </CardContent>
            </TabsContent>
        </Tabs>
      </Card>
      {selectedQuote && selectedAssetConfig && (
        <AssetDetailModal
          asset={{ ...selectedAssetConfig, price: getPriceFromQuote(selectedQuote, selectedAssetId) || 0, change: selectedQuote.variacao_pct || 0, absoluteChange: 0, lastUpdated: '' }}
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
