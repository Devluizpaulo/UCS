
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommodityPriceData } from '@/lib/types';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

interface CurrenciesCardProps {
  data: CommodityPriceData[];
  loading: boolean;
}

export function CurrenciesCard({ data, loading }: CurrenciesCardProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Moedas</CardTitle>
        <CardDescription>
          Cotações das principais moedas em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="space-y-3 px-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[150px] w-full">
            <UnderlyingAssetsTable data={data} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
