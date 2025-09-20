
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import type { CommodityPriceData } from '@/lib/types';
import { AssetCard } from './asset-card';

interface DashboardPageProps {
  initialData: CommodityPriceData[];
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minuto

export function DashboardPage({ initialData }: DashboardPageProps) {
  const [data, setData] = useState(initialData);
  const [changedAssets, setChangedAssets] = useState<Record<string, 'up' | 'down'>>({});
  const isLoading = data.length === 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cotacoes');
        if (!response.ok) {
          throw new Error('Failed to fetch updated data');
        }
        const newData: CommodityPriceData[] = await response.json();
        
        const changes: Record<string, 'up' | 'down'> = {};
        newData.forEach(newAsset => {
          const oldAsset = data.find(d => d.id === newAsset.id);
          if (oldAsset && oldAsset.price !== newAsset.price) {
            changes[newAsset.id] = newAsset.price > oldAsset.price ? 'up' : 'down';
          }
        });

        setData(newData);
        setChangedAssets(changes);

        // Remove the 'changed' status after the animation
        setTimeout(() => {
          setChangedAssets({});
        }, 1500); // Animation duration is 1.5s

      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };

    const intervalId = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [data]);


  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel de Cotações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <AssetCard key={i} loading />)
          ) : (
            data.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset}
                changeStatus={changedAssets[asset.id]}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
