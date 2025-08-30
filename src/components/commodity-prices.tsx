"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';


export function CommodityPrices() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ativos Subjacentes</CardTitle>
        <CardDescription>Preços em tempo real das commodities no índice.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <UnderlyingAssetsTable />
      </CardContent>
    </Card>
  );
}
