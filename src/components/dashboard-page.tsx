
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { CurrenciesCard } from '@/components/currencies-card';
import { CommoditiesCard } from '@/components/commodities-card';
import { IndexHistoryCard } from '@/components/index-history-card';
import { DatePicker } from './ui/date-picker';
import { Button } from './ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel">
        <DatePicker date={selectedDate} setDate={handleDateChange} />
      </PageHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {/* Índice UCS em destaque - ocupa toda a largura */}
        <div className="w-full">
          <UCSIndexDisplay selectedDate={formattedDate} />
        </div>
        
        {/* Grid com duas colunas para Moedas e Commodities */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <CurrenciesCard selectedDate={formattedDate} />
          <CommoditiesCard selectedDate={formattedDate} />
        </div>
        
        {/* Histórico do Índice */}
        <div className="w-full">
          <IndexHistoryCard selectedDate={formattedDate} />
        </div>
      </main>
    </div>
  );
}
