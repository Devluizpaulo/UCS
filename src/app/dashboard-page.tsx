
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { CommodityPrices } from '@/components/commodity-prices';
import { IndexHistoryCard } from '@/components/index-history-card';
import type { CommodityPriceData, ChartData, UcsData, FormulaParameters } from '@/lib/types';
import { getCommodityPrices, getUcsIndexHistory } from '@/lib/data-service';
import { getFormulaParameters } from '@/lib/formula-service';
import { calculateIndex } from '@/lib/calculation-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const [allCommodities, setAllCommodities] = useState<CommodityPriceData[]>([]);
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const [historyData, setHistoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all raw data in parallel
        const [commodities, formulaParams, history] = await Promise.all([
          getCommodityPrices(),
          getFormulaParameters(),
          getUcsIndexHistory('1d'),
        ]);

        if (!formulaParams.isConfigured) {
          throw new Error('A fórmula do índice não foi configurada. Acesse as Configurações para definir os parâmetros.');
        }

        // Calculate the index directly in the client component
        const calculatedUcsData = calculateIndex(commodities, formulaParams);
        
        setAllCommodities(commodities);
        setUcsData(calculatedUcsData);
        setHistoryData(history);

      } catch (err: any) {
        console.error('Failed to fetch or process dashboard data:', err);
        setError(err.message || 'Não foi possível carregar os dados do painel. Verifique a configuração do sistema e sua conexão.');
        // Ensure we don't show stale data on error
        setUcsData(null);
        setAllCommodities([]);
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Erro no Painel" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao Carregar Dados</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="w-full">
          <UCSIndexDisplay initialData={ucsData} chartData={historyData} loading={loading} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
           <CommodityPrices data={allCommodities} loading={loading} />
           <IndexHistoryCard initialData={historyData} isConfigured={ucsData?.isConfigured ?? false} loading={loading} />
        </div>
      </main>
    </div>
  );
}
