
'use client';

import { UnderlyingAssetsTable } from './underlying-assets-table';
import type { CommodityPriceData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface CommodityPricesProps {
  data: CommodityPriceData[];
  displayDate?: string;
  loading?: boolean;
}

export function CommodityPrices({ data, displayDate, loading }: CommodityPricesProps) {

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle>Cotações</CardTitle>
            <CardDescription>
                {displayDate === 'Tempo Real'
                    ? "Variação baseada no fechamento do dia anterior."
                    : `Exibindo cotações para ${displayDate}.`
                }
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <UnderlyingAssetsTable data={data} loading={loading} />
        </CardContent>
    </Card>
    </>
  );
}
