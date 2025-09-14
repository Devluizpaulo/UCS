'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCommodityPrices } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import { CommoditiesTable } from './commodities-table';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

interface CommoditiesCardProps {
  selectedDate?: string;
}

export function CommoditiesCard({ selectedDate }: CommoditiesCardProps) {
  const [commodityData, setCommodityData] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setLoading(true);
        const allData = await getCommodityPrices();
        // Filtrar commodities (todas as categorias exceto 'exchange')
        const commodities = allData.filter(item => item.category !== 'exchange');
        setCommodityData(commodities);
      } catch (error) {
        console.error('Erro ao carregar dados de commodities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();
  }, [selectedDate]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Commodities</CardTitle>
        <CardDescription>
          Preços dos ativos subjacentes que compõem o índice UCS.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[250px] w-full">
            <CommoditiesTable data={commodityData} selectedDate={selectedDate} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
