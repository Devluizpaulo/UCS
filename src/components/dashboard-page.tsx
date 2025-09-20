
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { CommodityPrices } from '@/components/commodity-prices';
import type { CommodityPriceData } from '@/lib/types';
import { getCommodityPrices } from '@/lib/data-service';

export function DashboardPage() {
  const [allCommodities, setAllCommodities] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  // We use useEffect to fetch data on the client-side.
  // This avoids issues with server-side rendering and caching complexities for now.
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Directly call the server function.
        const commodities = await getCommodityPrices();
        setAllCommodities(commodities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
           <CommodityPrices data={allCommodities} loading={loading} />
        </div>
      </main>
    </div>
  );
}
