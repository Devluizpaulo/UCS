
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UcsIndexChart } from './ucs-index-chart';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import type { ChartData, HistoryInterval, UcsData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { getUcsIndexHistory, getUcsIndexValue } from '@/lib/data-service';

export function MarketTrends() {
  const [historyInterval, setHistoryInterval] = useState<HistoryInterval>('1d');
  const [indexHistoryData, setIndexHistoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleIntervalChange = useCallback(async (interval: HistoryInterval) => {
    setHistoryInterval(interval);
    if (!isConfigured) return;

    setLoading(true);
    try {
        const result = await getUcsIndexHistory(interval);
        setIndexHistoryData(result);
    } catch (error) {
        console.error(`Failed to fetch index history for interval ${interval}:`, error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar histórico",
            description: "Não foi possível carregar os dados históricos.",
        });
    } finally {
        setLoading(false);
    }
  }, [toast, isConfigured]);

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [history, latestValue] = await Promise.all([
              getUcsIndexHistory('1d'),
              getUcsIndexValue(),
            ]);
            setIndexHistoryData(history);
            setIsConfigured(latestValue.isConfigured);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar dados",
                description: "Não foi possível carregar os dados iniciais do índice.",
            });
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, [toast]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
            <CardTitle>Tendências de Mercado</CardTitle>
            <CardDescription>Análise da performance histórica do Índice UCS.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
         <UcsIndexChart data={indexHistoryData} loading={loading || !isConfigured}/>
      </CardContent>
    </Card>
  );
}
