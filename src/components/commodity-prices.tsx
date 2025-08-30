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
  data: CommodityPriceData[];
  loading: boolean;
}

export function CommodityPrices({ data, loading }: CommodityPricesProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ativos Subjacentes</CardTitle>
        <CardDescription>Preços em tempo real das commodities no índice.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <UnderlyingAssetsTable data={data} loading={loading}/>
      </CardContent>
    </Card>
  );
}
