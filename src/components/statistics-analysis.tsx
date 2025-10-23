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
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Activity,
  DollarSign,
  Percent,
  Target,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetDetailModal } from './asset-detail-modal';
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

// Função para extrair preço de uma cotação
const getPriceFromQuote = (quote: FirestoreQuote, assetId: string): number | undefined => {
  if (!quote) return undefined;
  
  if (assetId === 'ucs_ase') {
    const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
    return typeof value === 'number' ? value : undefined;
  }
  
  if (quote.ultimo_brl) {
      return quote.ultimo_brl;
  }

  const value = quote.valor ?? quote.ultimo;
  return typeof value === 'number' ? value : undefined;
};


// Componente de métrica individual
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}) => {
  const trendColors = {
    positive: 'text-green-600 bg-green-50 border-green-200',
    negative: 'text-red-600 bg-red-50 border-red-200',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200'
  };
  
  return (
    <Card className={`${trendColors[trend || 'neutral']} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="text-2xl opacity-60">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export function StatisticsAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<Record<string, FirestoreQuote[]>>({});
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('PDM');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<CommodityPriceData | null>(null);

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

  const [frequencyAnalysis, setFrequencyAnalysis] = useState<any>(null);
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState(false);

  const currentData = data[selectedAssetId] || [];

  useEffect(() => {
    const calculateMetrics = async () => {
      if (currentData.length === 0) {
        setFrequencyAnalysis(null);
        return;
      }
      
      setIsCalculatingMetrics(true);
      try {
        const analysis = await calculateFrequencyAwareMetrics(currentData, selectedAssetId);
        setFrequencyAnalysis(analysis);
      } catch (error) {
        console.error('Erro ao calcular métricas:', error);
        setFrequencyAnalysis(null);
      } finally {
        setIsCalculatingMetrics(false);
      }
    };

    calculateMetrics();
  }, [currentData, selectedAssetId]);

  const metrics = frequencyAnalysis?.metrics;

  const handleQuoteClick = (quote: FirestoreQuote) => {
    const asset = assets.find(a => a.id === selectedAssetId);
    if(asset) {
        const priceData: CommodityPriceData = {
            ...asset,
            price: getPriceFromQuote(quote, selectedAssetId) || 0,
            change: quote.variacao_pct || 0,
            absoluteChange: quote.variacao_abs || 0,
            lastUpdated: quote.data,
        };
        setSelectedAssetForModal(priceData);
    }
  };

  const FrequencyInfo = () => {
    if (!frequencyAnalysis || !frequencyAnalysis.frequency || currentData.length === 0) return null;
    
    const getFrequencyLabel = (freq: string) => {
      switch (freq) {
        case 'monthly': return 'Mensal';
        case 'daily': return 'Diária';
        case 'mixed': return 'Mista';
        default: return 'Desconhecida';
      }
    };
    
    const getFrequencyDescription = (freq: string) => {
      switch (freq) {
        case 'monthly': return 'Cotações mensais (todo dia 01)';
        case 'daily': return 'Cotações diárias (segunda a sexta)';
        case 'mixed': return 'Transição de mensal para diária';
        default: return '';
      }
    };
    
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                Frequência das Cotações: {getFrequencyLabel(frequencyAnalysis.frequency)}
              </p>
              <p className="text-sm text-blue-700">
                {getFrequencyDescription(frequencyAnalysis.frequency)}
                {frequencyAnalysis.frequency === 'mixed' && frequencyAnalysis.transitionDate && (
                  <span className="ml-2">
                    (Transição em {format(frequencyAnalysis.transitionDate, 'dd/MM/yyyy')})
                  </span>
                )}
              </p>
              {frequencyAnalysis.frequency === 'mixed' && (
                <p className="text-xs text-blue-600 mt-1">
                  {frequencyAnalysis.monthlyCount} cotações mensais • {frequencyAnalysis.dailyCount} cotações diárias
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UCSASEValues = () => {
    if (selectedAssetId !== 'ucs_ase' || currentData.length === 0) return null;
    
    const latestQuote = currentData[0];
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <DollarSign className="h-5 w-5" />
            Valores UCS ASE - {latestQuote.data || 'Última Cotação'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">BRL</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(latestQuote.valor_brl || 0, 'BRL', 'ucs_ase')}
              </p>
              <p className="text-xs text-green-600">Real Brasileiro</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">USD</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(latestQuote.valor_usd || 0, 'USD', 'ucs_ase')}
              </p>
              <p className="text-xs text-green-600">Dólar Americano</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">EUR</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(latestQuote.valor_eur || 0, 'EUR', 'ucs_ase')}
              </p>
              <p className="text-xs text-green-600">Euro</p>
            </div>
          </div>
          
          {latestQuote.conversoes && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">Conversões:</p>
              <div className="space-y-1 text-xs text-green-700">
                {latestQuote.conversoes.brl_para_eur && (
                  <p>BRL → EUR: {latestQuote.conversoes.brl_para_eur}</p>
                )}
                {latestQuote.conversoes.brl_para_usd && (
                  <p>BRL → USD: {latestQuote.conversoes.brl_para_usd}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">Histórico Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
           <FrequencyInfo />
           <UCSASEValues />
          
          <AdvancedPerformanceChart 
            quotes={currentData} 
            assetId={selectedAssetId} 
            isLoading={isLoading || isCalculatingMetrics}
            title="Análise de Performance"
            showMetrics={true}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <AdvancedPerformanceChart 
            quotes={currentData} 
            assetId={selectedAssetId} 
            isLoading={isLoading || isCalculatingMetrics}
            title="Análise Detalhada de Performance"
            showMetrics={true}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <HistoricalPriceTable
            assetId={selectedAssetId}
            assetConfig={selectedAssetConfig}
            data={currentData}
            isLoading={isLoading}
            onRowClick={handleQuoteClick}
          />
        </TabsContent>
      </Tabs>

      {selectedAssetForModal && (
        <AssetDetailModal
          asset={selectedAssetForModal}
          isOpen={!!selectedAssetForModal}
          onOpenChange={() => setSelectedAssetForModal(null)}
        />
      )}
    </div>
  );
}
