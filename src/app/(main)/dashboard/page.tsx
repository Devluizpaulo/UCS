
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import type { CommodityPriceData } from '@/lib/types';
import { CommodityPrices } from '@/components/commodity-prices';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minuto

export default function DashboardPage({ initialData }: DashboardPageProps) {
  const [data, setData] = useState(initialData);
  const isLoading = data.length === 0 && initialData.length === 0;

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cotacoes');
        if (!response.ok) {
          throw new Error('Failed to fetch updated data');
        }
        const newData: CommodityPriceData[] = await response.json();
        setData(newData);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };

    const intervalId = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader 
        title="Painel de Cotações"
        description="Cotações em tempo real dos principais ativos do mercado."
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div>
          <CommodityPrices loading={isLoading} data={data} />
        </div>
      </main>
    </div>
  );
}
