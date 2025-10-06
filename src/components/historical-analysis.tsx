
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
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico } from '@/lib/data-service';
import { getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, Loader2 } from 'lucide-react';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetInfo, AssetSpecificDetails, GenericAssetDetails } from './asset-detail-modal';
import { UcsAseDetails } from './ucs-ase-details';
import { PdfExportButton } from './pdf-export-button';

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

export function HistoricalAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<FirestoreQuote[]>([]);
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCommodityConfigs().then(setAssets);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Always fetch 90 days for the graph context
    getCotacoesHistorico(selectedAssetId, 90)
      .then((history) => {
        setData(history);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, [selectedAssetId]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const { chartData, latestQuote, mainAssetData } = useMemo(() => {
    if (data.length === 0 || !selectedAssetConfig) {
        return { chartData: [], latestQuote: null, mainAssetData: null };
    }

    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.timestamp as any).getTime();
        const dateB = new Date(b.timestamp as any).getTime();
        return dateB - dateA; // Mais recente primeiro
    });

    const quoteForDate = sortedData.find(q => {
        const quoteDate = new Date(q.timestamp as any);
        return format(quoteDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
    }) || sortedData[0];
    
    if (!quoteForDate) {
       return { chartData: [], latestQuote: null, mainAssetData: null };
    }

    const chartPoints = sortedData
      .map((quote) => {
        const dateObject = new Date(quote.timestamp as any);
        let dateFormat = 'dd/MM';
        return {
           date: format(dateObject, dateFormat, { locale: ptBR }),
           value: quote.ultimo ?? quote.valor,
        }
      }).reverse(); // Reverte para ordem cronológica no gráfico
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: isForexAsset ? (quoteForDate.ultimo ?? 0) : (quoteForDate.valor_brl ?? quoteForDate.valor ?? quoteForDate.ultimo ?? 0),
        currency: isForexAsset ? selectedAssetConfig.currency : 'BRL',
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (quoteForDate.ultimo ?? 0) - (quoteForDate.fechamento_anterior ?? (quoteForDate.ultimo ?? 0)),
        lastUpdated: quoteForDate.data || format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy'),
    };

    return { chartData: chartPoints, latestQuote: quoteForDate, mainAssetData: mainAsset };
  }, [data, targetDate, selectedAssetConfig]);
  
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
                    secondaryIndices: [], // Populate as needed
                    currencies: [], // Populate as needed
                    otherAssets: [], // Populate as needed
                    targetDate,
                }}
                reportType="asset-detail"
                disabled={isLoading || data.length === 0}
            >
                Exportar PDF
            </PdfExportButton>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 p-4">
        {mainAssetData ? <AssetInfo asset={mainAssetData} /> : <Skeleton className="h-24 w-full" />}

        <div ref={chartRef} className="h-72 w-full bg-background pt-4 pr-4" style={{ marginLeft: '-10px' }}>
          {isLoading ? (
            <ChartSkeleton />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value), selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id), ' ']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <ReferenceLine 
                    y={mainAssetData?.price} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="2 2"
                    opacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name=" "
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Sem dados históricos para exibir o gráfico.</p>
            </div>
          )}
        </div>
        
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
                historicalData={data} 
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
