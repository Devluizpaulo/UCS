
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { CurrenciesCard } from '@/components/currencies-card';
import { CommoditiesCard } from '@/components/commodities-card';
import { IndexHistoryCard } from '@/components/index-history-card';
import { DatePicker } from './ui/date-picker';
import { format } from 'date-fns';
import type { CommodityPriceData } from '@/lib/types';
import { getCommodityPrices } from '@/lib/data-service';

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [allCommodities, setAllCommodities] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const data = await getCommodityPrices(selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined);
        setAllCommodities(data);
      } catch (error) {
        console.error('Failed to fetch commodity prices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const currencyData = allCommodities.filter(item => item.category === 'exchange');
  const commodityData = allCommodities.filter(item => item.category !== 'exchange');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel">
        <DatePicker date={selectedDate} setDate={handleDateChange} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="w-full">
          <UCSIndexDisplay selectedDate={formattedDate} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <CurrenciesCard data={currencyData} loading={loading} />
          <CommoditiesCard data={commodityData} loading={loading} />
        </div>
        
        <div className="w-full">
          <IndexHistoryCard selectedDate={formattedDate} />
        </div>
      </main>
    </div>
  );
}
