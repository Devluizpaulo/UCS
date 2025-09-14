'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCommodityPrices } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import { CurrenciesTable } from './currencies-table';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

interface CurrenciesCardProps {
  selectedDate?: string;
}

export function CurrenciesCard({ selectedDate }: CurrenciesCardProps) {
  const [currencyData, setCurrencyData] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const allData = await getCommodityPrices();
        // Filtrar apenas moedas (categoria 'exchange')
        const currencies = allData.filter(item => item.category === 'exchange');
        setCurrencyData(currencies);
      } catch (error) {
        console.error('Erro ao carregar dados de moedas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, [selectedDate]);

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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
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
          <ScrollArea className="h-[250px] w-full">
            <CurrenciesTable data={currencyData} selectedDate={selectedDate} />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
