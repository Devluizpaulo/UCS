
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import type { CommodityPriceData } from '@/lib/types';


interface CommodityPricesProps {
  loading: boolean;
  data: CommodityPriceData[];
}

export function CommodityPrices({ loading, data }: CommodityPricesProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ativos Subjacentes</CardTitle>
        <CardDescription>Preços em tempo real das commodities no índice.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <UnderlyingAssetsTable loading={loading} data={data} />
      </CardContent>
    </Card>
  );
}
