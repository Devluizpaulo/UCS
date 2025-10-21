
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isValid, parse, subDays } from 'date-fns';
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

// Lista de ativos disponíveis baseada no que temos dados no banco
const UCS_ASE_COMPARISON_ASSETS = ['PDM', 'milho', 'boi_gordo', 'madeira', 'carbono', 'soja'];
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
        // Para UCS ASE, usar valor_brl como principal, com fallbacks
        const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
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
  const [selectedAssetId, setSelectedAssetId] = useState<string>('PDM');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleAssets, setVisibleAssets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('🔧 [HistoricalAnalysis] Carregando configurações de commodities...');
    getCommodityConfigs()
      .then(configs => {
        console.log('✅ [HistoricalAnalysis] Configurações carregadas:', configs.length, 'ativos');
        setAssets(configs);
      })
      .catch(error => {
        console.error('❌ [HistoricalAnalysis] Erro ao carregar configurações:', error);
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const assetsToFetch = UCS_ASE_COMPARISON_ASSETS;
    const daysToFetch = timeRangeInDays[timeRange];
    
    console.log(`🔍 Fetching historical data for ${assetsToFetch.length} assets, ${daysToFetch} days`);
    
    Promise.all(assetsToFetch.map(async (id) => {
      console.log(`📊 Fetching data for ${id}...`);
      const history = await getCotacoesHistorico(id, daysToFetch);
      console.log(`📊 ${id}: ${history.length} records found`);
      return history;
    }))
      .then((histories) => {
        const newData: Record<string, FirestoreQuote[]> = {};
        histories.forEach((history, index) => {
          newData[assetsToFetch[index]] = history;
          console.log(`✅ ${assetsToFetch[index]}: ${history.length} records loaded`);
        });
        
        // Log total data
        const totalRecords = Object.values(newData).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📈 Total records loaded: ${totalRecords}`);
        
        setData(newData);
        setVisibleAssets(
            assetsToFetch.reduce((acc, id) => ({ ...acc, [id]: true }), {})
        );
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching historical data:", err);
        setData({});
        setIsLoading(false);
      });
  }, [timeRange]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);
  
  const { chartData, mainAssetData, isMultiLine, assetNames } = useMemo(() => {
    const names: Record<string, string> = {};
    assets.forEach(a => {
        names[a.id] = a.name;
    });

    console.log(`🔄 Processing chart data for ${selectedAssetId}`);
    console.log(`📊 Data keys:`, Object.keys(data));
    console.log(`📊 Selected asset config:`, selectedAssetConfig);

    if (Object.keys(data).length === 0 || !selectedAssetConfig) {
      console.log(`⚠️ No data or config found. Data keys: ${Object.keys(data).length}, Config: ${!!selectedAssetConfig}`);
      return { chartData: [], mainAssetData: null, isMultiLine: false, assetNames: names };
    }

    const mainHistory = data[selectedAssetId] || [];
    console.log(`📈 Main history for ${selectedAssetId}: ${mainHistory.length} records`);
    
    const sortedData = [...mainHistory].sort((a, b) => {
      // Priorizar o campo 'data' que contém a data real da cotação
      const dateA = a.data ? parseISO(a.data.split('/').reverse().join('-')) : new Date(a.timestamp as any);
      const dateB = b.data ? parseISO(b.data.split('/').reverse().join('-')) : new Date(b.timestamp as any);
      return dateB.getTime() - dateA.getTime();
    });
    console.log(`📈 Sorted data: ${sortedData.length} records`);
    
    const quoteForDate = sortedData.find(q => {
        if (!q) return false;
        try {
            // Priorizar o campo 'data' para comparação
            let quoteDate: Date;
            if (q.data) {
                // Converter de DD/MM/YYYY para Date
                const [day, month, year] = q.data.split('/');
                quoteDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
                quoteDate = new Date(q.timestamp as any);
            }
            return format(quoteDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
        } catch {
            return false;
        }
    }) || sortedData[0];
    
    console.log(`📈 Quote for date: ${!!quoteForDate}`);
    if (!quoteForDate) {
       console.log(`⚠️ No quote found for date ${format(targetDate, 'yyyy-MM-dd')}`);
       return { chartData: [], mainAssetData: null, isMultiLine: false, assetNames: names };
    }

    const isMulti = selectedAssetId === 'PDM' || selectedAssetId === 'ucs_ase';
    let finalChartData: any[];

    const cutoffDate = subDays(new Date(), timeRangeInDays[timeRange]);

    if (isMulti) {
        const dataMap = new Map<string, any>();
        
        // Para PDM, mostrar componentes individuais
        if (selectedAssetId === 'PDM') {
            const pdmHistory = data['PDM'] || [];
            pdmHistory.forEach(quote => {
                if(!quote || !quote.componentes) return;
                try {
                  // Priorizar o campo 'data' para a data da cotação
                  let date: Date;
                  if (quote.data) {
                    const [day, month, year] = quote.data.split('/');
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  } else {
                    date = new Date(quote.timestamp as any);
                  }
                  
                  if(!isValid(date) || date < cutoffDate) return;

                  const dateStr = format(date, 'yyyy-MM-dd');
                  if (!dataMap.has(dateStr)) {
                      dataMap.set(dateStr, { date: format(date, 'dd/MM'), timestamp: date.getTime() });
                  }
                  
                  // Adicionar componentes do PDM
                  Object.entries(quote.componentes).forEach(([key, value]) => {
                      if (typeof value === 'number' && value > 0) {
                          dataMap.get(dateStr)[key] = value;
                      }
                  });
                } catch {}
            });
        } else {
            // Para outros ativos multi-linha
            UCS_ASE_COMPARISON_ASSETS.forEach(id => {
                const assetHistory = data[id] || [];
                assetHistory.forEach(quote => {
                    if(!quote) return;
                    try {
                      // Priorizar o campo 'data' para a data da cotação
                      let date: Date;
                      if (quote.data) {
                        const [day, month, year] = quote.data.split('/');
                        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      } else {
                        date = new Date(quote.timestamp as any);
                      }
                      
                      if(!isValid(date) || date < cutoffDate) return;

                      const dateStr = format(date, 'yyyy-MM-dd');
                      if (!dataMap.has(dateStr)) {
                          dataMap.set(dateStr, { date: format(date, 'dd/MM'), timestamp: date.getTime() });
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
        console.log(`📊 Multi-line chart data: ${finalChartData.length} points`);
    } else {
        finalChartData = sortedData
            .map(quote => {
                if(!quote) return null;
                 try {
                    // Priorizar o campo 'data' para a data da cotação
                    let date: Date;
                    if (quote.data) {
                      const [day, month, year] = quote.data.split('/');
                      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    } else {
                      date = new Date(quote.timestamp as any);
                    }
                    
                    if(!isValid(date) || date < cutoffDate) return null;
                    const price = getPriceFromQuote(quote, selectedAssetId);
                    return {
                        date: format(date, 'dd/MM'),
                        value: price,
                    }
                } catch { return null; }
            })
            .filter(item => item && item.value !== undefined)
            .reverse();
        console.log(`📊 Single-line chart data: ${finalChartData.length} points`);
    }
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: isForexAsset ? (quoteForDate.ultimo_brl ?? 0) : getPriceFromQuote(quoteForDate, selectedAssetId) ?? 0,
        currency: 'BRL', // Mostra sempre BRL
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (getPriceFromQuote(quoteForDate, selectedAssetId) ?? 0) - (getPriceFromQuote(quoteForDate.fechamento_anterior_quote, selectedAssetId) ?? (getPriceFromQuote(quoteForDate, selectedAssetId) ?? 0)),
        lastUpdated: quoteForDate.data || (quoteForDate.timestamp ? format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy') : 'N/A'),
    };

    console.log(`✅ Final result: ${finalChartData.length} chart points, mainAsset: ${!!mainAsset}`);
    
    return { chartData: finalChartData, mainAssetData: mainAsset, isMultiLine: isMulti, assetNames: names };
  }, [data, targetDate, selectedAssetConfig, selectedAssetId, assets, timeRange]);
  
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
      </Card>
    </>
  );
}
