
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UcsIndexChart } from './ucs-index-chart';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { getUcsIndexValue } from '@/lib/data-service';
import type { ChartData, HistoryInterval } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

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
        const result = await getUcsIndexValue(interval);
        setIndexHistoryData(result.history);
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
            const result = await getUcsIndexValue('1d'); // Start with daily
            setIndexHistoryData(result.history);
            setIsConfigured(result.latest.isConfigured);
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
            <CardDescription>Análise da performance histórica do Índice UCS em diferentes períodos.</CardDescription>
        </div>
         <Tabs defaultValue={historyInterval} onValueChange={(value) => handleIntervalChange(value as HistoryInterval)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1d" disabled={!isConfigured}>Diário</TabsTrigger>
                <TabsTrigger value="1wk" disabled={!isConfigured}>Semanal</TabsTrigger>
                <TabsTrigger value="1mo" disabled={!isConfigured}>Anual</TabsTrigger>
            </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
         <UcsIndexChart data={indexHistoryData} loading={loading || !isConfigured}/>
      </CardContent>
    </Card>
  );
}
