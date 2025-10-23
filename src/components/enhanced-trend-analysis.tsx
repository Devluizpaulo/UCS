
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isValid, subDays } from 'date-fns';
import type { FirestoreQuote, CommodityConfig } from '@/lib/types';
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
  LineChart
} from 'lucide-react';
import { Button } from './ui/button';
import { HistoricalAnalysisChart } from '@/components/charts/historical-analysis-chart';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdvancedPerformanceChart } from './charts/advanced-performance-chart';

// Lista de ativos disponíveis
const AVAILABLE_ASSETS = ['PDM', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja', 'ucs_ase'];
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const timeRangeInDays: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
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


// Componente de tabela histórica para um ativo específico
const AssetHistoricalTable = ({ 
  assetId, 
  data, 
  assetConfig, 
  isLoading 
}: { 
  assetId: string; 
  data: FirestoreQuote[]; 
  assetConfig: CommodityConfig | undefined;
  isLoading: boolean;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {assetConfig?.name || assetId.toUpperCase()} - Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado histórico disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar dados por data real da cotação (mais recente primeiro)
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.data ? parseISO(a.data.split('/').reverse().join('-')) : new Date(a.timestamp as any);
    const dateB = b.data ? parseISO(b.data.split('/').reverse().join('-')) : new Date(b.timestamp as any);
    return dateB.getTime() - dateA.getTime();
  });

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = sortedData.slice(startIndex, endIndex);
  
  const isForexAsset = assetId === 'soja' || assetId === 'carbono';

  const formatDate = (quote: FirestoreQuote) => {
    try {
      if (quote.data) {
        const [day, month, year] = quote.data.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValid(date) ? format(date, 'dd/MM/yyyy') : quote.data;
      }
      
      const date = new Date(quote.timestamp as any);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (quote: FirestoreQuote) => {
    try {
      const date = new Date(quote.timestamp as any);
      return isValid(date) ? format(date, 'HH:mm') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          {assetConfig?.name || assetId.toUpperCase()} - Histórico
          <Badge variant="secondary" className="ml-auto">
            {sortedData.length} registros
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                {isForexAsset && <TableHead className="text-right">Preço Original</TableHead>}
                <TableHead className="text-right">Preço (BRL)</TableHead>
                <TableHead className="text-right">Variação %</TableHead>
                <TableHead className="text-right">Variação Abs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((quote, index) => {
                const priceBRL = getPriceFromQuote(quote, assetId);
                const originalPrice = quote.ultimo;
                const variation = quote.variacao_pct ?? 0;
                const previousPriceBRL = index < sortedData.length - 1 ? 
                  getPriceFromQuote(sortedData[index + 1], assetId) : priceBRL;
                const absoluteChange = priceBRL && previousPriceBRL ? priceBRL - previousPriceBRL : 0;

                const uniqueKey = `${quote.documentId || 'no-id'}-${quote.timestamp || 'no-timestamp'}-${startIndex + index}`;

                return (
                  <TableRow key={uniqueKey}>
                    <TableCell className="font-medium">
                      {formatDate(quote)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(quote)}
                    </TableCell>
                     {isForexAsset && (
                        <TableCell className="text-right font-mono text-muted-foreground">
                            {originalPrice ? formatCurrency(originalPrice, assetConfig?.currency || 'BRL', assetId) : 'N/A'}
                        </TableCell>
                    )}
                    <TableCell className="font-mono text-right">
                      {priceBRL ? formatCurrency(priceBRL, 'BRL', assetId) : 'N/A'}
                    </TableCell>
                    <TableCell className={`text-right ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variation >= 0 ? '+' : ''}{variation.toFixed(2)}%
                    </TableCell>
                    <TableCell className={`text-right ${absoluteChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {absoluteChange >= 0 ? '+' : ''}{formatCurrency(absoluteChange, 'BRL', assetId)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </UITable>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
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

  const currentData = data[selectedAssetId] || [];

  const { chartData, mainAssetData, isMultiLine, assetNames } = useMemo(() => {
    if (!selectedAssetConfig) {
      return { chartData: [], mainAssetData: null, isMultiLine: false, assetNames: {} };
    }
  
    const processData = (history: FirestoreQuote[], assetId: string) => {
      return history
        .map(quote => {
          const price = getPriceFromQuote(quote, assetId);
          if (price === undefined) return null;
  
          let date: Date | null = null;
          if (quote.data) {
            try {
              const [day, month, year] = quote.data.split('/');
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } catch { date = null; }
          }
          if (!date || !isValid(date)) {
            date = quote.timestamp ? new Date(quote.timestamp as any) : null;
          }
          if (!date || !isValid(date)) return null;
  
          return {
            date: format(date, 'dd/MM/yyyy'),
            value: price,
            timestamp: date.getTime(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
    };
  
    const mainHistory = data[selectedAssetId] || [];
    const processedChartData = processData(mainHistory, selectedAssetId);
  
    const latestQuote = mainHistory.length > 0 ? mainHistory[0] : null;
    const latestPrice = latestQuote ? getPriceFromQuote(latestQuote, selectedAssetId) : 0;
    
    const mainAsset: CommodityPriceData = {
      ...selectedAssetConfig,
      price: latestPrice || 0,
      change: latestQuote?.variacao_pct ?? 0,
      absoluteChange: latestQuote?.variacao_abs ?? 0,
      lastUpdated: latestQuote?.data || new Date().toLocaleDateString('pt-BR'),
      currency: 'BRL',
    };
  
    return {
      chartData: processedChartData,
      mainAssetData: mainAsset,
      isMultiLine: false, 
      assetNames: { [selectedAssetId]: selectedAssetConfig.name },
    };
  }, [data, selectedAssetId, assets, selectedAssetConfig]);


  const handleVisibilityChange = (assetId: string) => {
    setVisibleAssets(prev => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com seleção de ativo e período */}
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
              <Button variant={timeRange === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('all')} className="h-8">Tudo</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">Histórico Completo</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <AdvancedPerformanceChart 
            quotes={currentData} 
            assetId={selectedAssetId} 
            isLoading={isLoading}
            title="Análise de Performance"
            showMetrics={true}
          />
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <AdvancedPerformanceChart 
            quotes={currentData} 
            assetId={selectedAssetId} 
            isLoading={isLoading}
            title="Análise Detalhada de Performance"
            showMetrics={true}
          />
        </TabsContent>

        {/* Tab: Histórico Completo */}
        <TabsContent value="history" className="space-y-6">
          <AssetHistoricalTable 
            assetId={selectedAssetId}
            data={currentData}
            assetConfig={selectedAssetConfig}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
