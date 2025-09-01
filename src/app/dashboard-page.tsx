
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle, Settings } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, CommodityPriceData, UcsData, HistoryInterval } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCommodityPrices, getUcsIndexValue } from '@/lib/data-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { IndexHistoryTable } from './index-history-table';
import { Skeleton } from './ui/skeleton';
import { AnimatedNumber } from './ui/animated-number';
import { IndexCompositionModal } from './index-composition-modal';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';


export function DashboardPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyInterval, setHistoryInterval] = useState<HistoryInterval>('1d');
  const [indexHistoryData, setIndexHistoryData] = useState<ChartData[]>([]);


  const fetchDashboardData = useCallback(async (isRefresh = false) => {
      setLoading(true);
      try {
        const [ucsResult, pricesResult] = await Promise.all([
          getUcsIndexValue('1d'), // Main chart always shows daily
          getCommodityPrices()
        ]);
        
        setChartData(ucsResult.history);
        setUcsData(ucsResult.latest);
        setCommodities(pricesResult);

        if (!isRefresh) {
            setIndexHistoryData(ucsResult.history);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar dados",
          description: "Não foi possível obter os dados em tempo real. Verifique o console para mais detalhes.",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  const fetchIndexHistory = useCallback(async (interval: HistoryInterval) => {
    setLoadingHistory(true);
    try {
        const result = await getUcsIndexValue(interval);
        setIndexHistoryData(result.history);
    } catch (error) {
        console.error(`Failed to fetch index history for interval ${interval}:`, error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar histórico",
            description: "Não foi possível carregar os dados históricos da tabela.",
        });
    } finally {
        setLoadingHistory(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (ucsData?.isConfigured) {
        fetchIndexHistory(historyInterval);
    }
  }, [historyInterval, fetchIndexHistory, ucsData?.isConfigured]);
  
  const latestValue = ucsData?.indexValue ?? 0;
  const isConfigured = ucsData?.isConfigured ?? false;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel">
        <Button onClick={() => fetchDashboardData(true)} disabled={loading} variant="outline" size="sm">
          {loading ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar Cotações
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
       
        {!loading && !isConfigured && (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Necessária</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>A fórmula do Índice UCS ainda não foi configurada. O valor do índice não será calculado até que os parâmetros sejam salvos.</span>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar Fórmula
                        </Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        <Card 
            className="border-border/60 bg-card/50 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => isConfigured && setIsModalOpen(true)}
        >
            <div className="p-6">
                 <CardTitle className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Índice UCS (R$)</CardTitle>
                 {loading && !ucsData ? (
                    <Skeleton className="h-16 w-64 mt-2" />
                 ) : (
                    <div className="text-6xl font-bold text-primary">
                        <AnimatedNumber value={latestValue} formatter={(v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/>
                    </div>
                 )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {isConfigured ? "Powered by bmv.global" : "Aguardando configuração da fórmula"}
                  </p>
            </div>
        </Card>
        {isModalOpen && ucsData && (
            <IndexCompositionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={ucsData}
            />
        )}


        <Card>
            <CardHeader>
                <CardTitle>Histórico do Índice</CardTitle>
                <CardDescription>Performance do Índice UCS nos últimos 30 dias.</CardDescription>
            </CardHeader>
            <CardContent>
                <UcsIndexChart data={chartData} loading={loading || !isConfigured}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ativos Subjacentes</CardTitle>
                <CardDescription>Preços de fechamento das commodities que compõem o índice UCS.</CardDescription>
            </CardHeader>
            <CardContent>
                <UnderlyingAssetsTable data={commodities} loading={loading}/>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Histórico de Cotações do Índice</CardTitle>
                    <CardDescription>Valores de fechamento do Índice UCS.</CardDescription>
                </div>
                <Tabs defaultValue="1d" onValueChange={(value) => setHistoryInterval(value as HistoryInterval)} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="1d" disabled={!isConfigured}>Diário</TabsTrigger>
                        <TabsTrigger value="1wk" disabled={!isConfigured}>Semanal</TabsTrigger>
                        <TabsTrigger value="1mo" disabled={!isConfigured}>Mensal</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <IndexHistoryTable data={indexHistoryData} loading={loadingHistory} isConfigured={isConfigured} />
            </CardContent>
        </Card>

      </main>
    </div>
  );
}
