
'use client';

import { useEffect, useState } from 'react';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import type { CommodityPriceData } from '@/lib/types';
import { PageHeader } from './page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minuto

interface CommodityPricesProps {
  initialData: CommodityPriceData[];
}

export function CommodityPrices({ initialData }: CommodityPricesProps) {
  const [data, setData] = useState<CommodityPriceData[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);

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
        console.error('Error refreshing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (initialData.length === 0) {
        fetchData();
    }
    
    const intervalId = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [initialData]);

  return (
    <>
      <PageHeader 
        title="Painel de Cotações"
        description="Cotações em tempo real dos principais ativos do mercado."
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
         <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Ativos Subjacentes</CardTitle>
                <CardDescription>Preços em tempo real das commodities que compõem os índices.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <UnderlyingAssetsTable loading={isLoading} data={data} />
            </CardContent>
        </Card>
      </main>
    </>
  );
}
