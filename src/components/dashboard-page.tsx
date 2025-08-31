'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, CommodityPriceData, IvcfData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCommodityPrices, getIvcfIndexValue } from '@/lib/data-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { IndexHistoryTable } from './index-history-table';
import { Skeleton } from './ui/skeleton';
import { AnimatedNumber } from './ui/animated-number';
import { IndexCompositionModal } from './index-composition-modal';


export function DashboardPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [ivcfData, setIvcfData] = useState<IvcfData | null>(null);
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
      setLoading(true);
      try {
        const [ivcfResult, pricesResult] = await Promise.all([
          getIvcfIndexValue(),
          getCommodityPrices()
        ]);
        
        setChartData(ivcfResult.history);
        setIvcfData(ivcfResult.latest);
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
  
  const latestValue = ivcfData?.indexValue ?? 0;

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
        <Card 
            className="border-border/60 bg-card/50 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsModalOpen(true)}
        >
            <div className="p-6">
                 <CardTitle className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Índice IVCF (R$)</CardTitle>
                 {loading && !ivcfData ? (
                    <Skeleton className="h-16 w-64 mt-2" />
                 ) : (
                    <div className="text-6xl font-bold text-primary">
                        <AnimatedNumber value={latestValue} formatter={(v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/>
                    </div>
                 )}
                  <p className="text-xs text-muted-foreground mt-1">Powered by bmv.global</p>
            </div>
        </Card>
        {isModalOpen && ivcfData && (
            <IndexCompositionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={ivcfData}
            />
        )}


        <Card>
            <CardHeader>
                <CardTitle>Histórico do Índice</CardTitle>
                <CardDescription>Performance do Índice IVCF nos últimos 30 dias.</CardDescription>
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
                        <CardDescription>Preços de fechamento das commodities que compõem o índice IVCF.</CardDescription>
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
                        <CardDescription>Valores de fechamento diário do Índice IVCF.</CardDescription>
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
