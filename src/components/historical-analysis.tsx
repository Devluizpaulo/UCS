'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
import { Info, Loader2, AlertCircle, Calendar, CheckSquare } from 'lucide-react';
import { AssetInfo } from './asset-detail-modal';
import { PdfExportButton } from './pdf-export-button';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const UCS_ASE_COMPARISON_ASSETS = ['ucs_ase', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
type TimeRange = '1d' | '7d' | '30d' | '1y' | 'all';

const timeRangeInDays: Record<TimeRange, number> = {
  '1d': 2, // 2 para ter dia anterior para variação
  '7d': 7,
  '30d': 30,
  '1y': 365,
  'all': 3650, // 10 years as "all"
};

const lineColors: { [key: string]: string } = {
  ucs_ase: 'hsl(var(--chart-1))',
  milho: 'hsl(var(--chart-2))',
  boi_gordo: 'hsl(var(--chart-3))',
  madeira: 'hsl(var(--chart-4))',
  carbono: 'hsl(var(--chart-5))',
  soja: 'hsl(220, 70%, 50%)',
  value: 'hsl(var(--chart-1))',
};

const MultiLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm">{`${entry.name}: `}</span>
            <span className="text-sm font-mono font-semibold">
              {formatCurrency(entry.value, 'BRL', entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DefaultTooltip = ({ active, payload, label, asset }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm">{`Preço: `}</span>
          <span className="text-sm font-mono font-semibold">
            {formatCurrency(payload[0].value, asset.currency, asset.id)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ChartSkeleton = () => (
    <div className="h-96 w-full">
      <Skeleton className="h-full w-full" />
    </div>
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
    const assetsToFetch = selectedAssetId === 'ucs_ase' ? UCS_ASE_COMPARISON_ASSETS : [selectedAssetId];
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
      .catch(() => {
        setData({});
        setIsLoading(false);
      });
  }, [selectedAssetId, timeRange]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);
  
  const { chartData, latestQuote, mainAssetData, isMultiLine } = useMemo(() => {
    if (Object.keys(data).length === 0 || !selectedAssetConfig) {
      return { chartData: [], latestQuote: null, mainAssetData: null, isMultiLine: false };
    }

    const mainHistory = data[selectedAssetId] || [];
    const sortedData = [...mainHistory].sort((a, b) => (new Date(b.timestamp as any)).getTime() - (new Date(a.timestamp as any)).getTime());
    const quoteForDate = sortedData.find(q => format(new Date(q.timestamp as any), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')) || sortedData[0];
    
    if (!quoteForDate) {
       return { chartData: [], latestQuote: null, mainAssetData: null, isMultiLine: false };
    }

    const isMulti = selectedAssetId === 'ucs_ase';
    let finalChartData;

    if (isMulti) {
        const dataMap = new Map<string, any>();
        UCS_ASE_COMPARISON_ASSETS.forEach(id => {
            const assetHistory = data[id] || [];
            assetHistory.forEach(quote => {
                const dateStr = format(new Date(quote.timestamp as any), 'dd/MM/yyyy');
                if (!dataMap.has(dateStr)) {
                    dataMap.set(dateStr, { date: dateStr, timestamp: new Date(quote.timestamp as any).getTime() });
                }
                const value = quote.valor_brl ?? quote.valor ?? quote.ultimo ?? 0;
                dataMap.get(dateStr)[id] = value;
            });
        });
        finalChartData = Array.from(dataMap.values()).sort((a,b) => a.timestamp - b.timestamp);
    } else {
        finalChartData = sortedData
            .map(quote => ({
                date: format(new Date(quote.timestamp as any), 'dd/MM', { locale: ptBR }),
                value: quote.valor ?? quote.ultimo ?? 0,
            }))
            .reverse();
    }
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: isForexAsset ? (quoteForDate.ultimo ?? 0) : (quoteForDate.valor_brl ?? quoteForDate.valor ?? quoteForDate.ultimo ?? 0),
        currency: isForexAsset ? selectedAssetConfig.currency : 'BRL',
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (quoteForDate.ultimo ?? 0) - (quoteForDate.fechamento_anterior ?? (quoteForDate.ultimo ?? 0)),
        lastUpdated: quoteForDate.data || format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy'),
    };

    return { chartData: finalChartData, latestQuote: quoteForDate, mainAssetData: mainAsset, isMultiLine: isMulti };
  }, [data, targetDate, selectedAssetConfig, selectedAssetId]);
  
  const handleVisibilityChange = (assetId: string) => {
    setVisibleAssets(prev => ({
        ...prev,
        [assetId]: !prev[assetId],
    }));
  };

  const LegendContent = () => (
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
                onCheckedChange={() => handleVisibilityChange(id)}
                style={{borderColor: color}}
              />
              <Label htmlFor={id} className="text-sm font-medium leading-none flex items-center gap-2">
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
                  {isLoading ? (
                    <ChartSkeleton />
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          domain={['dataMin', 'dataMax']}
                          tickFormatter={(value) => formatCurrency(value as number, selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id)}
                        />
                        <Tooltip
                          content={isMultiLine ? <MultiLineTooltip /> : <DefaultTooltip asset={mainAssetData} />}
                        />
                        
                        {isMultiLine ? (
                          Object.keys(visibleAssets)
                            .filter(key => visibleAssets[key])
                            .map(key => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={assets.find(a => a.id === key)?.name || key.toUpperCase()}
                                stroke={lineColors[key]}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2 }}
                              />
                            ))
                        ) : (
                          <>
                            <ReferenceLine y={mainAssetData?.price} stroke="hsl(var(--primary))" strokeDasharray="3 3" opacity={0.8} />
                            <Line type="monotone" dataKey="value" name="Preço" stroke={lineColors['value']} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mr-2" />
                        <p>Sem dados históricos para exibir o gráfico.</p>
                    </div>
                  )}
                </div>

                 {isMultiLine && (
                    <div className="lg:col-span-1">
                        <LegendContent />
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </>
  );
}
