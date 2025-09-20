
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { CommodityPrices } from '@/components/commodity-prices';
import { IndexHistoryCard } from '@/components/index-history-card';
import type { CommodityPriceData, ChartData, UcsData } from '@/lib/types';
import { getCommodityPrices, getUcsIndexValue, getUcsIndexHistory } from '@/lib/data-service';

export function DashboardPage() {
  const [allCommodities, setAllCommodities] = useState<CommodityPriceData[]>([]);
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const [historyData, setHistoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const commodities = await getCommodityPrices();
        setAllCommodities(commodities);

        // We get default/empty data for UCS Index to keep it disabled for now.
        const ucsValue = await getUcsIndexValue();
        const history = await getUcsIndexHistory();
        setUcsData(ucsValue);
        setHistoryData(history);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="w-full">
          {/* The UCS Index Display will show a disabled state because getUcsIndexValue returns isConfigured: false */}
          <UCSIndexDisplay initialData={ucsData} chartData={historyData} loading={loading} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
           <CommodityPrices data={allCommodities} loading={loading} />
           {/* The history card will show a disabled state as well */}
           <IndexHistoryCard initialData={historyData} isConfigured={ucsData?.isConfigured ?? false} loading={loading} />
        </div>
      </main>
    </div>
  );
}
