
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
  ReferenceLine,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetInfo, AssetSpecificDetails, GenericAssetDetails } from './asset-detail-modal';
import { UcsAseDetails } from './ucs-ase-details';
import { PdfExportButton } from './pdf-export-button';
import { Button } from './ui/button';

const ChartSkeleton = () => (
  <div className="h-72 w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

const TableSkeleton = () => (
    <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
);

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

const UCS_ASE_COMPARISON_ASSETS = ['ucs_ase', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
type TimeRange = '30d' | '1y' | 'all';

const timeRangeInDays: Record<TimeRange, number> = {
  '30d': 30,
  '1y': 365,
  'all': 3650, // 10 years as "all"
};

export function HistoricalAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<Record<string, FirestoreQuote[]>>({});
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

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

    const sortedData = [...mainHistory].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp as any).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp as any).getTime() : 0;
        return dateB - dateA;
    });

    const quoteForDate = sortedData.find(q => {
        const quoteDate = q.timestamp ? new Date(q.timestamp as any) : null;
        return quoteDate && format(quoteDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
    }) || sortedData[0];
    
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
                // CORREÇÃO: Usar valor_brl para o UCS ASE
                const value = id === 'ucs_ase' ? (quote.valor_brl ?? quote.valor ?? quote.ultimo ?? 0) : (quote.valor ?? quote.ultimo ?? 0);
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
        lastUpdated: quoteForDate.data || (quoteForDate.timestamp ? format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy') : 'N/A'),
    };

    return { chartData: finalChartData, latestQuote: quoteForDate, mainAssetData: mainAsset, isMultiLine: isMulti };
  }, [data, targetDate, selectedAssetConfig, selectedAssetId]);
  
  const lineColors: { [key: string]: string } = {
    ucs_ase: 'hsl(var(--chart-1))',
    milho: 'hsl(var(--chart-2))',
    boi_gordo: 'hsl(var(--chart-3))',
    madeira: 'hsl(var(--chart-4))',
    carbono: 'hsl(var(--chart-5))',
    soja: 'hsl(220, 70%, 50%)',
    custo_agua: 'hsl(190, 80%, 60%)',
    value: 'hsl(var(--chart-1))',
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
            >
                Exportar PDF
            </PdfExportButton>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 p-4">
        {mainAssetData ? <AssetInfo asset={mainAssetData} /> : <Skeleton className="h-24 w-full" />}
        
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    Análise Temporal
                  </CardTitle>
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                      <Button variant={timeRange === '30d' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('30d')} className="h-8">30D</Button>
                      <Button variant={timeRange === '1y' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('1y')} className="h-8">1A</Button>
                      <Button variant={timeRange === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setTimeRange('all')} className="h-8">Tudo</Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="h-80 w-full bg-background pt-4 pr-4" style={{ marginLeft: '-10px' }}>
              {isLoading ? (
                <ChartSkeleton />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    {isMultiLine && <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />}
                    
                    {isMultiLine ? (
                      Object.keys(lineColors)
                        .filter(key => key in chartData[0])
                        .map(key => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={assets.find(a => a.id === key)?.name || key.toUpperCase()}
                            stroke={lineColors[key]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, stroke: lineColors[key], strokeWidth: 2 }}
                          />
                        ))
                    ) : (
                      <>
                        <ReferenceLine y={mainAssetData?.price} stroke="hsl(var(--primary))" strokeDasharray="2 2" opacity={0.5} />
                        <Line type="monotone" dataKey="value" name="Preço" stroke={lineColors['value']} strokeWidth={2} dot={false} />
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
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Dados Históricos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Detalhes do Dia ({latestQuote?.data || format(targetDate, 'dd/MM/yyyy')})</h3>
            <div className="flex items-start gap-2 p-3 mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>A seção abaixo mostra os dados detalhados para o dia mais recente do período selecionado, específicos para o ativo analisado.</p>
            </div>
            {isLoading ? (
              <TableSkeleton />
            ) : mainAssetData && latestQuote ? (
              mainAssetData.id === 'ucs_ase' ? (
                <UcsAseDetails asset={mainAssetData} />
              ) : (
                AssetSpecificDetails({ asset: mainAssetData, quote: latestQuote }) || <GenericAssetDetails asset={mainAssetData} quote={latestQuote} />
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">Nenhum detalhe adicional disponível para este dia.</p>
            )}
          </TabsContent>
          <TabsContent value="history" className="pt-4">
             <HistoricalPriceTable 
                asset={mainAssetData!}
                historicalData={data[selectedAssetId] || []} 
                isLoading={isLoading} 
                onRowClick={() => {}}
              />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
