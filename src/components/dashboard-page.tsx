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

export function DashboardPage() {
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
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
        <Card className="shadow-sm">
            <UcsIndexChart data={chartData} loading={loading}/>
        </Card>

        <Tabs defaultValue="assets">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assets">Ativos Subjacentes</TabsTrigger>
                <TabsTrigger value="history">Histórico do Índice</TabsTrigger>
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
