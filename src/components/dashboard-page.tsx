
'use client';

import { PageHeader } from '@/components/page-header';
import type { CommodityPriceData } from '@/lib/types';
import { AssetCard } from './asset-card';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

export function DashboardPage({ initialData }: DashboardPageProps) {
  const isLoading = initialData.length === 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <AssetCard key={i} loading />)
          ) : (
            initialData.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
