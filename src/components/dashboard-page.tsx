
'use client';

import { PageHeader } from '@/components/page-header';
import { CommodityPrices } from '@/components/commodity-prices';
import type { CommodityPriceData } from '@/lib/types';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

export function DashboardPage({ initialData }: DashboardPageProps) {
  // Reset: Component now expects data but the initial load will be empty.
  // The loading state is true if initialData is not provided or empty.
  const loading = initialData.length === 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
           <CommodityPrices data={initialData} loading={true} />
        </div>
      </main>
    </div>
  );
}
