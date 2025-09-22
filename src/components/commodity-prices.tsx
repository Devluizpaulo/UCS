
'use client';

import { UnderlyingAssetsTable } from './underlying-assets-table';
import type { CommodityPriceData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface CommodityPricesProps {
  initialData: CommodityPriceData[];
  displayDate?: string;
  loading?: boolean;
}

export function CommodityPrices({ initialData, displayDate, loading }: CommodityPricesProps) {

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
         <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Ativos Subjacentes</CardTitle>
                <CardDescription>
                    {displayDate 
                        ? `Preços para ${displayDate}.`
                        : 'Preços das commodities que compõem os índices.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <UnderlyingAssetsTable data={initialData} loading={loading} />
            </CardContent>
        </Card>
      </main>
    </>
  );
}
