
'use client';

import { UnderlyingAssetsTable } from './underlying-assets-table';
import type { CommodityPriceData } from '@/lib/types';
import { PageHeader } from './page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface CommodityPricesProps {
  initialData: CommodityPriceData[];
}

export function CommodityPrices({ initialData }: CommodityPricesProps) {
  return (
    <>
      <PageHeader 
        title="Painel de Cotações"
        description="Cotações em tempo real dos principais ativos do mercado."
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
         <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Ativos Subjacentes</CardTitle>
                <CardDescription>Preços em tempo real das commodities que compõem os índices.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <UnderlyingAssetsTable data={initialData} />
            </CardContent>
        </Card>
      </main>
    </>
  );
}
