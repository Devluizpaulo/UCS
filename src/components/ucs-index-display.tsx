
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { IndexCompositionModal } from './index-composition-modal';
import type { ChartData, UcsData } from '@/lib/types';
import { getUcsIndexValue, getUcsIndexHistory } from '@/lib/data-service'; // Keep for refresh
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/ucs-pricing-service';

interface UCSIndexDisplayProps {
  className?: string;
  initialData: UcsData | null;
  chartData: ChartData[];
  loading: boolean;
}

export function UCSIndexDisplay({ className, initialData, chartData: initialChartData, loading: initialLoading }: UCSIndexDisplayProps) {
  const [ucsData, setUcsData] = useState<UcsData | null>(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [chartData, setChartData] = useState<ChartData[]>(initialChartData);
  const [showChart, setShowChart] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [formattedVm, setFormattedVm] = useState('');
  const [formattedVus, setFormattedVus] = useState('');
  const [formattedCrs, setFormattedCrs] = useState('');

  const [formattedUcsCF, setFormattedUcsCF] = useState('');
  const [formattedUcsASE, setFormattedUcsASE] = useState('');
  const [formattedIvp, setFormattedIvp] = useState('');


  useEffect(() => {
    setUcsData(initialData);
    setChartData(initialChartData);
    setLoading(initialLoading);

    if (!initialLoading && initialData) {
      if (!initialData.isConfigured) {
          setError('Parâmetros da fórmula não configurados. Configure em Configurações.');
      }
      setLastUpdate(new Date());

       if (initialChartData.length > 1) {
          const current = initialChartData[initialChartData.length - 1].value;
          const prev = initialChartData[initialChartData.length - 2].value;
          if (current > prev) setTrend('up');
          else if (current < prev) setTrend('down');
          else setTrend('stable');
      }
       setFormattedUcsCF(formatCurrency(initialData.ucsCF, 'BRL'));
       setFormattedUcsASE(formatCurrency(initialData.ucsASE, 'BRL'));
       setFormattedIvp(formatCurrency(initialData.ivp, 'BRL'));

       setFormattedVm(formatCurrency(initialData.components.vm, 'BRL'));
       setFormattedVus(formatCurrency(initialData.components.vus, 'BRL'));
       setFormattedCrs(formatCurrency(initialData.components.crs, 'BRL'));
    }
  }, [initialData, initialChartData, initialLoading]);


  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestData, history] = await Promise.all([
          getUcsIndexValue(),
          getUcsIndexHistory('1d')
      ]);

      setUcsData(latestData);
      setChartData(history);
      setLastUpdate(new Date());

       setFormattedUcsCF(formatCurrency(latestData.ucsCF, 'BRL'));
       setFormattedUcsASE(formatCurrency(latestData.ucsASE, 'BRL'));
       setFormattedIvp(formatCurrency(latestData.ivp, 'BRL'));
       setFormattedVm(formatCurrency(latestData.components.vm, 'BRL'));
       setFormattedVus(formatCurrency(latestData.components.vus, 'BRL'));
       setFormattedCrs(formatCurrency(latestData.components.crs, 'BRL'));

      if (history.length > 1) {
          const current = history[history.length - 1].value;
          const prev = history[history.length - 2].value;
          if (current > prev) setTrend('up');
          else if (current < prev) setTrend('down');
          else setTrend('stable');
      }
      
      if (!latestData.isConfigured) {
          setError('Parâmetros da fórmula não configurados. Configure em Configurações.');
      }

    } catch (error) {
      console.error('Erro ao atualizar índice UCS:', error);
      setError(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderLoadingSkeleton = () => (
     <div className="space-y-4">
        <div className="flex items-baseline justify-between">
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-9 w-32" />
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
            </div>
             <div>
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
            </div>
             <div>
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
            </div>
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-4 w-40" />
        </div>
    </div>
  );

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Índice UCS (Unidade de Crédito de Sustentabilidade)</CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             renderLoadingSkeleton()
          ) : error && ucsData?.isConfigured === false ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            ucsData && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-x-6 gap-y-2">
                         <div>
                            <p className="text-3xl font-bold text-primary">{formattedUcsCF}</p>
                            <p className="text-xs text-muted-foreground mt-1">UCS Crédito de Floresta</p>
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-foreground/80">{formattedUcsASE}</p>
                            <p className="text-xs text-muted-foreground mt-1">UCS ASE</p>
                        </div>
                        <div>
                            <p className="text-xl font-medium text-muted-foreground">{formattedIvp}</p>
                            <p className="text-xs text-muted-foreground mt-1">IVP (Insumo)</p>
                        </div>
                    </div>
                  <Button variant="outline" size="sm" onClick={() => setIsCompositionModalOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Composição
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-semibold">{formattedVm}</p>
                        <p className="text-xs text-muted-foreground">VMAD</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{formattedVus}</p>
                        <p className="text-xs text-muted-foreground">VUS</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{formattedCrs}</p>
                        <p className="text-xs text-muted-foreground">CRS</p>
                    </div>
                </div>
                
                {showChart && chartData.length > 0 && (
                  <div className="mt-4">
                    <Separator className="my-4" />
                    <div className="h-[200px]">
                      <UcsIndexChart data={chartData} loading={loading} />
                    </div>
                  </div>
                )}
                
                {lastUpdate && (
                  <div className="flex items-center justify-end text-xs text-muted-foreground pt-2">
                    <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
                  </div>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
      
      {ucsData && (
        <IndexCompositionModal 
            isOpen={isCompositionModalOpen} 
            onClose={() => setIsCompositionModalOpen(false)} 
            data={ucsData}
        />
      )}
    </>
  );
}
