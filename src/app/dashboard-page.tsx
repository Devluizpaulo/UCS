
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { CommodityPrices } from '@/components/commodity-prices';
import { IndexHistoryCard } from '@/components/index-history-card';
import type { CommodityPriceData } from '@/lib/types';
import { getCommodityPrices } from '@/lib/data-service';

export function DashboardPage() {
  const [allCommodities, setAllCommodities] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const data = await getCommodityPrices();
        setAllCommodities(data);
      } catch (error) {
        console.error('Failed to fetch commodity prices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="w-full">
          <UCSIndexDisplay />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
           <CommodityPrices data={allCommodities} loading={loading} />
           <IndexHistoryCard />
        </div>
      </main>
    </div>
  );
}
