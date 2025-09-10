
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { UCSIndexDisplay } from '@/components/ucs-index-display';
import { UnderlyingAssetsCard } from './underlying-assets-card';
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
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <UCSIndexDisplay selectedDate={formattedDate} />
          </div>

          <div className="lg:col-span-2">
            <UnderlyingAssetsCard selectedDate={formattedDate} />
          </div>
        </div>
      </main>
    </div>
  );
}
