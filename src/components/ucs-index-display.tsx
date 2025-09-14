

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { getFormulaParameters } from '@/lib/formula-service';
import type { ChartData, UcsData } from '@/lib/types';
import { getUcsIndexValue, getUcsIndexHistory } from '@/lib/data-service';
import { Skeleton } from './ui/skeleton';

interface UCSIndexDisplayProps {
  className?: string;
  selectedDate?: string; // YYYY-MM-DD
}

export function UCSIndexDisplay({ className, selectedDate }: UCSIndexDisplayProps) {
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const calculateUCSIndex = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // The API route now handles the calculation and saving.
      const url = date ? `/api/ucs-index?date=${date}` : '/api/ucs-index';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch UCS Index data from API');
      }
      const latestData: UcsData = await response.json();

      const history = await getUcsIndexHistory('1d');
      
      setUcsData(latestData);
      setChartData(history);
      setLastUpdate(new Date());

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
      console.error('Erro ao calcular índice UCS:', error);
      setError(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateUCSIndex(selectedDate);
  }, [selectedDate, calculateUCSIndex]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
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
          <div className="flex items-center gap-3">
            <img 
              src="/image/ucs.png" 
              alt="UCS Coin" 
              className="w-12 h-12"
            />
            <div>
              <CardTitle className="text-sm font-medium">Índice UCS</CardTitle>
              <CardDescription>Unidade de Crédito de Sustentabilidade</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => calculateUCSIndex(selectedDate)}
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
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                      {formatCurrency(ucsData.indexValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Moeda UCS
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsCompositionModalOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Composição
                  </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-semibold">{formatCurrency(ucsData.components.vm)}</p>
                        <p className="text-xs text-muted-foreground">VMAD</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{formatCurrency(ucsData.components.vus)}</p>
                        <p className="text-xs text-muted-foreground">VUS</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{formatCurrency(ucsData.components.crs)}</p>
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
