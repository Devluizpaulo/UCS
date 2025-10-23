'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import type { FirestoreQuote } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { calculateFrequencyAwareMetrics, getCotacoesHistorico } from '@/lib/data-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';

interface PerformanceChartProps {
  quotes: FirestoreQuote[];
  assetId: string;
  isLoading: boolean;
  title?: string;
  showMetrics?: boolean;
}

// Função para extrair preço de uma cotação
const getPriceFromQuote = (quote: FirestoreQuote, assetId: string): number | undefined => {
  if (!quote) return undefined;
  
  if (assetId === 'ucs_ase') {
    // Para UCS ASE, usar valor_brl como principal, com fallbacks
    const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
    return typeof value === 'number' ? value : undefined;
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

// Componente de gráfico de performance avançado
const AdvancedPerformanceChart = ({ 
  quotes, 
  assetId, 
  isLoading,
  title = "Gráfico de Performance",
  showMetrics = true
}: PerformanceChartProps) => {
  const chartData = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];
    
    return quotes
      .map(quote => {
        const price = getPriceFromQuote(quote, assetId);
        if (price === undefined) return null;
        
        const date = quote.timestamp ? new Date(quote.timestamp as any) : null;
        if (!date || !isValid(date)) return null;
        
        return {
          date: format(date, 'dd/MM'),
          price,
          timestamp: date.getTime(),
          variation: quote.variacao_pct ?? 0
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [quotes, assetId]);

  const [frequencyAnalysis, setFrequencyAnalysis] = useState<any>(null);
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState(false);

  useEffect(() => {
    const calculateMetrics = async () => {
      if (quotes.length === 0) {
        setFrequencyAnalysis(null);
        return;
      }
      
      setIsCalculatingMetrics(true);
      try {
        const analysis = await calculateFrequencyAwareMetrics(quotes, assetId);
        setFrequencyAnalysis(analysis);
      } catch (error) {
        console.error('Erro ao calcular métricas:', error);
        setFrequencyAnalysis(null);
      } finally {
        setIsCalculatingMetrics(false);
      }
    };

    calculateMetrics();
  }, [quotes, assetId]);
  
  const metrics = frequencyAnalysis?.metrics;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado disponível para exibir o gráfico</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const chartHeight = 300;
  const chartWidth = 800;
  
  // Calcular pontos da linha
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Calcular área sob a curva
  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico SVG */}
        <div className="h-80 relative overflow-hidden">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            <defs>
              <linearGradient id={`priceGradient-${assetId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05"/>
              </linearGradient>
              <linearGradient id={`lineGradient-${assetId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1"/>
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <g key={i}>
                <line
                  x1="0"
                  y1={ratio * chartHeight}
                  x2={chartWidth}
                  y2={ratio * chartHeight}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x="0"
                  y={ratio * chartHeight + 4}
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {formatCurrency(minPrice + (1 - ratio) * priceRange, 'BRL', assetId)}
                </text>
              </g>
            ))}
            
            {/* Area under curve */}
            <polygon
              fill={`url(#priceGradient-${assetId})`}
              points={areaPoints}
            />
            
            {/* Price line */}
            <polyline
              fill="none"
              stroke={`url(#lineGradient-${assetId})`}
              strokeWidth="3"
              points={points}
            />
            
            {/* Data points */}
            {chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * chartWidth;
              const y = chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                  className="hover:r-4 transition-all cursor-pointer"
                />
              );
            })}
          </svg>
        </div>

        {/* Métricas de performance */}
        {showMetrics && metrics && (
          <div className="space-y-4">
            {/* Informação de frequência */}
            {frequencyAnalysis.frequency && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Frequência:</strong> {
                    frequencyAnalysis.frequency === 'monthly' ? 'Mensal' :
                    frequencyAnalysis.frequency === 'daily' ? 'Diária' :
                    'Mista (Transição)'
                  }
                  {frequencyAnalysis.frequency === 'mixed' && (
                    <span className="ml-2">
                      ({frequencyAnalysis.monthlyCount} mensais • {frequencyAnalysis.dailyCount} diárias)
                    </span>
                  )}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Retorno Total"
                value={`${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                trend={metrics.totalReturn >= 0 ? 'positive' : 'negative'}
                subtitle={`${metrics.totalDays} dias`}
              />
              <MetricCard
                title="Volatilidade"
                value={`${metrics.volatility.toFixed(2)}%`}
                icon={<Activity className="h-5 w-5" />}
                trend="neutral"
                subtitle="Desvio padrão diário"
              />
              <MetricCard
                title="Max Drawdown"
                value={`${metrics.maxDrawdown.toFixed(2)}%`}
                icon={<TrendingDown className="h-5 w-5" />}
                trend="negative"
                subtitle="Maior perda"
              />
              <MetricCard
                title="Sharpe Ratio"
                value={metrics.sharpeRatio.toFixed(2)}
                icon={<Target className="h-5 w-5" />}
                trend={metrics.sharpeRatio >= 1 ? 'positive' : metrics.sharpeRatio >= 0 ? 'neutral' : 'negative'}
                subtitle="Retorno/risco"
              />
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Preço Atual</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.currentPrice, 'BRL', assetId)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Máximo</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.high, 'BRL', assetId)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Mínimo</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.low, 'BRL', assetId)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { AdvancedPerformanceChart, MetricCard };
