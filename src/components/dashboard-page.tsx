
'use client';

import { PageHeader } from '@/components/page-header';
import { CommodityPrices } from '@/components/commodity-prices';
import type { CommodityPriceData } from '@/lib/types';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

export function DashboardPage({ initialData }: DashboardPageProps) {
  // Data is now passed directly as a prop from a Server Component.
  // The loading state is determined by whether the initial data array is empty.
  const isLoading = initialData.length === 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
           <CommodityPrices data={initialData} loading={isLoading} />
        </div>
      </main>
    </div>
  );
}
