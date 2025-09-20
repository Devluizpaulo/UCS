
'use client';

import { PageHeader } from '@/components/page-header';
import { CommodityPrices } from '@/components/commodity-prices';
import type { CommodityPriceData } from '@/lib/types';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

export function DashboardPage({ initialData }: DashboardPageProps) {
  // The data is now fetched on the server and passed as a prop.
  // This simplifies the component, removing the need for client-side fetching and loading states.
  const loading = !initialData;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
           <CommodityPrices data={initialData} loading={loading} />
        </div>
      </main>
    </div>
  );
}
