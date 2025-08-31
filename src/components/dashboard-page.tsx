'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, CommodityPriceData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCommodityPrices, getUcsIndexValue } from '@/lib/data-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { IndexHistoryTable } from './index-history-table';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';


interface DashboardPageProps {
    ucsCoinImageUrl: string;
}

export function DashboardPage({ ucsCoinImageUrl }: DashboardPageProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
      setLoading(true);
      try {
        const [historyResult, pricesResult] = await Promise.all([
          getUcsIndexValue(),
          getCommodityPrices()
        ]);
        
        setChartData(historyResult);
        setCommodities(pricesResult);

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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value.toFixed(4) : '0.0000';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel">
        <Button onClick={() => fetchDashboardData()} disabled={loading} variant="outline" size="sm">
          {loading ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar Cotações
        </Button>
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card className="border-border bg-card shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 p-6">
                 <div className="flex justify-center md:justify-start">
                   <Image 
                     src={ucsCoinImageUrl} 
                     alt="Moeda UCS" 
                     width={150} 
                     height={150} 
                     className="rounded-full"
                     data-ai-hint="coin logo"
                     priority
                    />
                </div>
                <div className="md:col-span-2 text-center md:text-left">
                     <CardTitle className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Índice UCS</CardTitle>
                     {loading && chartData.length === 0 ? (
                        <Skeleton className="h-16 w-64 mt-2 mx-auto md:mx-0" />
                     ) : (
                        <p className="text-6xl font-bold text-primary">
                            {latestValue}
                        </p>
                     )}
                      <p className="text-xs text-muted-foreground mt-1">Powered by Yahoo Finance</p>
                </div>
            </div>
        </Card>

        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Histórico do Índice</CardTitle>
                <CardDescription>Performance do Índice UCS nos últimos 60 minutos.</CardDescription>
            </CardHeader>
            <CardContent>
                <UcsIndexChart data={chartData} loading={loading}/>
            </CardContent>
        </Card>

        <Tabs defaultValue="assets">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assets">Ativos Subjacentes</TabsTrigger>
                <TabsTrigger value="history">Histórico do Índice (Tabela)</TabsTrigger>
            </TabsList>
            <TabsContent value="assets">
                <Card>
                    <CardHeader>
                        <CardTitle>Ativos Subjacentes</CardTitle>
                        <CardDescription>Preços em tempo real das commodities que compõem o índice UCS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UnderlyingAssetsTable data={commodities} loading={loading}/>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Cotações do Índice</CardTitle>
                        <CardDescription>Valores de fechamento diário do Índice UCS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IndexHistoryTable data={chartData} loading={loading} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
