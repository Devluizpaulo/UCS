
'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Brush,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Download, Share2, ZoomIn, ZoomOut, RotateCcw, BarChart3, TrendingDown, Calendar, BarChart, Activity, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMediaQuery } from '@/hooks/use-media-query';

// Enhanced Tooltip with better design and animations
const EnhancedMultiLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-xl p-4 shadow-xl backdrop-blur-sm max-w-xs animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="font-semibold text-sm mb-3 text-foreground border-b pb-2">
          📅 {label}
        </div>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-sm font-mono font-bold text-primary">
                {formatCurrency(entry.value, 'BRL', entry.dataKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EnhancedDefaultTooltip = ({ active, payload, label, asset }: any) => {
  if (active && payload && payload.length && asset) {
    const value = payload[0].value;
    const change = asset?.change || 0;
    const isPositive = change >= 0;
    
    return (
      <div className="bg-background border rounded-xl p-4 shadow-xl backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="font-semibold text-sm mb-3 text-foreground border-b pb-2">
          📅 {label}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">💰 Preço</span>
            <span className="text-sm font-mono font-bold text-primary">
              {formatCurrency(value, asset.currency, asset.id)}
            </span>
          </div>
          {asset?.change !== undefined && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">📊 Variação</span>
              <div className="flex items-center gap-1">
                {isPositive ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`text-sm font-mono font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced Skeleton with better loading animation
const EnhancedChartSkeleton = () => (
  <div className="h-full w-full relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-pulse" />
    <Skeleton className="h-full w-full rounded-lg" />
    <div className="absolute top-4 left-4 right-4 h-8 bg-muted/30 rounded animate-pulse" />
    <div className="absolute bottom-4 left-4 h-6 w-32 bg-muted/30 rounded animate-pulse" />
    <div className="absolute bottom-4 right-4 h-6 w-24 bg-muted/30 rounded animate-pulse" />
  </div>
);

// Performance Metrics Component
const PerformanceMetrics = ({ data, mainAsset }: { data: any[], mainAsset: CommodityPriceData | null }) => {
  const metrics = React.useMemo(() => {
    if (!data || data.length < 2 || !mainAsset) return null;
    
    const prices = data.map(d => d.value || d[mainAsset.id]).filter(Boolean);
    if (prices.length < 2) return null;
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    const returnPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
    const volatility = calculateVolatility(prices);
    const maxDrawdown = calculateMaxDrawdown(prices);
    const sharpeRatio = calculateSharpeRatio(prices);
    
    return {
      return: returnPercent,
      volatility,
      maxDrawdown,
      sharpeRatio,
      high: maxPrice,
      low: minPrice
    };
  }, [data, mainAsset]);
  
  if (!metrics) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      <MetricCard 
        title="Retorno" 
        value={`${metrics.return >= 0 ? '+' : ''}${metrics.return.toFixed(2)}%`}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={metrics.return >= 0 ? 'positive' : 'negative'}
      />
      <MetricCard 
        title="Volatilidade" 
        value={`${metrics.volatility.toFixed(2)}%`}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <MetricCard 
        title="Max Drawdown" 
        value={`${metrics.maxDrawdown.toFixed(2)}%`}
        icon={<TrendingDown className="h-4 w-4" />}
        trend="negative"
      />
      <MetricCard 
        title="Sharpe Ratio" 
        value={metrics.sharpeRatio.toFixed(2)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard 
        title="Máximo" 
        value={formatCurrency(metrics.high, mainAsset?.currency || 'BRL', mainAsset?.id)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard 
        title="Mínimo" 
        value={formatCurrency(metrics.low, mainAsset?.currency || 'BRL', mainAsset?.id)}
        icon={<TrendingDown className="h-4 w-4" />}
      />
    </div>
  );
};

const MetricCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: 'positive' | 'negative' }) => (
  <Card className="p-3 hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-0">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className={`text-lg font-bold ${trend === 'positive' ? 'text-green-600' : trend === 'negative' ? 'text-red-600' : 'text-foreground'}`}>
        {value}
      </div>
    </CardContent>
  </Card>
);

// Helper functions for calculations
const calculateVolatility = (prices: number[]) => {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
};

const calculateMaxDrawdown = (prices: number[]) => {
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    }
    const drawdown = ((peak - prices[i]) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
};

const calculateSharpeRatio = (prices: number[]) => {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = calculateVolatility(prices) / 100;
  
  return volatility > 0 ? meanReturn / volatility : 0;
};

interface HistoricalAnalysisChartProps {
    isLoading: boolean;
    chartData: any[];
    isMultiLine: boolean;
    mainAssetData: CommodityPriceData | null;
    visibleAssets: Record<string, boolean>;
    lineColors: Record<string, string>;
    assetNames: Record<string, string>;
    showMetrics?: boolean;
}

export const HistoricalAnalysisChart = React.memo(({ 
    isLoading, 
    chartData, 
    isMultiLine, 
    mainAssetData,
    visibleAssets,
    lineColors,
    assetNames,
    showMetrics = true,
}: HistoricalAnalysisChartProps) => {
  const { resolvedTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeLegend, setActiveLegend] = React.useState<string | null>(null);
  const [zoomDomain, setZoomDomain] = React.useState<[number, number] | null>(null);
  const [showBrush, setShowBrush] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [chartType, setChartType] = React.useState<'line' | 'area' | 'bar'>('line');
  const [showMovingAverage, setShowMovingAverage] = React.useState(false);

  // Calculate moving average for enhanced analysis
  const calculateMovingAverage = React.useMemo(() => {
    if (!showMovingAverage || !chartData || chartData.length < 7) return null;
    
    const period = 7; // 7-day moving average
    const movingAvg = chartData.map((_, index) => {
      if (index < period - 1) return null;
      
      const slice = chartData.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, item) => {
        const value = isMultiLine ? Object.values(item).find(val => typeof val === 'number' && val > 0) || 0 : item.value || 0;
        return acc + value;
      }, 0);
      
      return sum / period;
    });
    
    return chartData.map((item, index) => ({
      ...item,
      movingAverage: movingAvg[index]
    }));
  }, [chartData, showMovingAverage, isMultiLine]);

  // Enhanced error state with better design and more helpful information
  if (!chartData || chartData.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="relative">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <TrendingDown className="h-10 w-10 text-primary/60" />
          </div>
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
        </div>
        
        <div className="space-y-3 max-w-lg">
          <h3 className="text-xl font-bold text-foreground">Dados Insuficientes</h3>
          <p className="text-muted-foreground leading-relaxed">
            Não há dados históricos suficientes para gerar o gráfico. 
            Para uma análise completa, são necessários pelo menos <strong>2 pontos de dados</strong>.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
            <h4 className="font-semibold text-sm text-foreground">💡 Sugestões:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Selecione um período com mais dados históricos</li>
              <li>• Verifique se o ativo possui histórico suficiente</li>
              <li>• Tente selecionar um ativo diferente</li>
              <li>• Verifique a conexão com o banco de dados</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar Dados
          </Button>
          <Button 
            variant="default" 
            onClick={() => {
              // Scroll to date picker or trigger date selection
              const datePicker = document.querySelector('[data-date-picker]');
              if (datePicker) {
                datePicker.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Alterar Período
          </Button>
        </div>
      </div>
    );
  }

  // Chart Controls Component
  const ChartControls = () => (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
      {/* Chart Type Selector */}
      <div className="flex items-center gap-1 bg-background rounded-md p-1">
        <Button
          variant={chartType === 'line' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('line')}
          className="h-8 px-2"
        >
          <LineChart className="h-4 w-4" />
        </Button>
        <Button
          variant={chartType === 'area' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('area')}
          className="h-8 px-2"
        >
          <Activity className="h-4 w-4" />
        </Button>
        <Button
          variant={chartType === 'bar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setChartType('bar')}
          className="h-8 px-2"
        >
          <BarChart className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowBrush(!showBrush)}
        className={`h-8 px-2 ${showBrush ? 'bg-primary/10 text-primary' : ''}`}
      >
        {showBrush ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setZoomDomain(null)}
        className="h-8 px-2"
        disabled={!zoomDomain}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border" />

      {/* Analysis Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMovingAverage(!showMovingAverage)}
        className={`h-8 px-2 ${showMovingAverage ? 'bg-primary/10 text-primary' : ''}`}
      >
        <TrendingUp className="h-4 w-4 mr-1" />
        Média Móvel
      </Button>

      <div className="w-px h-6 bg-border" />

      {/* Export Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="h-8 px-2"
      >
        {isExporting ? <AlertCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-8 px-2"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Export and Share handlers
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Export logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate export
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Análise Histórica de Ativos',
        text: 'Confira esta análise histórica de ativos',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return <EnhancedChartSkeleton />;
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Chart Controls */}
      {showMetrics && <ChartControls />}
      
          {/* Main Chart */}
          <div className="relative">
            <ResponsiveContainer 
              width="100%" 
              height={isMobile ? 300 : 450}
            >
              <LineChart 
                data={calculateMovingAverage || chartData} 
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
            <defs>
              <linearGradient id="chart-bg" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={resolvedTheme === 'dark' ? "hsl(var(--chart-1) / 0.15)" : "hsl(var(--chart-1) / 0.08)"} 
                  stopOpacity={0.15}
                />
                <stop 
                  offset="95%" 
                  stopColor={resolvedTheme === 'dark' ? "hsl(var(--chart-1) / 0.02)" : "hsl(var(--chart-1) / 0.02)"} 
                  stopOpacity={0.02}
                />
              </linearGradient>
              
              {/* Gradient for each line */}
              {Object.keys(lineColors).map(key => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColors[key]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={lineColors[key]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            
            <CartesianGrid 
              vertical={false} 
              horizontal={true}
              stroke="hsl(var(--border))" 
              opacity={0.3}
              strokeDasharray="2 4"
            />
            
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                const date = new Date(value);
                return isMobile ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
                               : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              }}
            />
            
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => formatCurrency(value as number, mainAssetData?.currency || 'BRL', mainAssetData?.id)}
              yAxisId="left"
              width={isMobile ? 60 : 80}
            />
            
            <Tooltip
              content={isMultiLine ? <EnhancedMultiLineTooltip /> : <EnhancedDefaultTooltip asset={mainAssetData} />}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
              animationDuration={200}
            />
            
            {isMultiLine && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ 
                  right: -10, 
                  top: -5,
                  fontSize: isMobile ? '10px' : '12px'
                }}
                onMouseEnter={(props) => setActiveLegend(props.dataKey as string)}
                onMouseLeave={() => setActiveLegend(null)}
              />
            )}
            
            {/* Reference Lines for better analysis */}
            {mainAssetData?.price && !isMultiLine && (
              <>
                <ReferenceLine 
                  y={mainAssetData.price} 
                  stroke="hsl(var(--primary))" _
                  strokeDasharray="5 5" 
                  opacity={0.8}
                  label={{ value: "Preço Atual", position: "top" }}
                />
              </>
            )}
            
            {/* Dynamic Lines with enhanced animations */}
            {isMultiLine ? (
              Object.keys(visibleAssets)
                .filter(key => visibleAssets[key])
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={assetNames[key] || key.toUpperCase()}
                    stroke={lineColors[key]}
                    strokeWidth={activeLegend === key ? 4 : 2.5}
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 2, 
                      stroke: lineColors[key],
                      fill: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                    yAxisId="left"
                    strokeOpacity={activeLegend && activeLegend !== key ? 0.3 : 1}
                    animationDuration={800 + (index * 100)}
                    animationEasing="ease-in-out"
                    connectNulls={false}
                  />
                ))
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Preço" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2, 
                    stroke: 'hsl(var(--chart-1))',
                    fill: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }} 
                  yAxisId="left"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
                
                {/* Moving Average Line */}
                {showMovingAverage && calculateMovingAverage && (
                  <Line 
                    type="monotone" 
                    dataKey="movingAverage" 
                    name="Média Móvel (7 dias)" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false} 
                    activeDot={{ 
                      r: 4, 
                      strokeWidth: 2, 
                      stroke: "#8884d8",
                      fill: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }} 
                    yAxisId="left"
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                )}
              </>
            )}
            
            {/* Brush for zoom functionality */}
            {showBrush && (
              <Brush
                dataKey="date"
                height={30}
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.1)"
                onChange={(domain) => {
                  if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
                    setZoomDomain([domain.startIndex, domain.endIndex]);
                  }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Performance Metrics */}
      {showMetrics && <PerformanceMetrics data={chartData} mainAsset={mainAssetData} />}
    </div>
  );
});
