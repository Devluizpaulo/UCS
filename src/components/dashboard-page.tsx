'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import { CommodityPrices } from '@/components/commodity-prices';
import type { ChartData, CommodityPriceData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { calculateUcsIndex } from '@/ai/flows/calculate-ucs-index-flow';
import { getCommodityPrices } from '@/ai/flows/get-commodity-prices-flow';
import { generateRealisticHistoricalData } from '@/lib/utils';

export function DashboardPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
      setLoading(true);
      try {
        const commodityNames = ['Créditos de Carbono', 'Boi Gordo', 'Milho', 'Soja', 'Madeira', 'Água'];
        
        // Fetch index and prices in parallel
        const [indexResult, pricesResult] = await Promise.all([
          calculateUcsIndex(),
          getCommodityPrices({ commodities: commodityNames })
        ]);

        const { indexValue } = indexResult;
        setCommodities(pricesResult);
        
        setChartData((prevData) => {
          if (prevData.length === 0) {
            // Generate realistic historical data for the first load
            return generateRealisticHistoricalData(indexValue, 30, 0.05, 'minute');
          }
          // On subsequent fetches, append the new data point
          const newDataPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: indexValue,
          };
          return [...prevData.slice(1), newDataPoint];
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar dados do painel",
          description: "Não foi possível carregar os dados. Verifique o log para mais detalhes.",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData(); // Initial fetch
    const interval = setInterval(fetchDashboardData, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <UcsIndexChart data={chartData} loading={loading}/>
          </div>
          <div className="col-span-4 lg:col-span-3">
            <CommodityPrices data={commodities} loading={loading}/>
          </div>
        </div>
      </main>
    </div>
  );
}
