
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { addDays, format, parseISO, isValid, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateNavigator } from '@/components/date-navigator';
import { Skeleton } from '@/components/ui/skeleton';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [targetDate, setTargetDate] = useState<Date | null>(getValidatedDate(dateParam));
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    // It prevents hydration mismatch by ensuring the initial server render
    // and client render are the same before this effect updates the state.
    const initialDate = getValidatedDate(dateParam) || new Date();
    setTargetDate(initialDate);
  }, [dateParam]);


  useEffect(() => {
    if (!targetDate) return;

    setIsLoading(true);
    const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
    
    const fetchData = async () => {
      const result = isCurrentDateOrFuture 
        ? await getCommodityPrices() 
        : await getCommodityPricesByDate(targetDate);
      setData(result);
      setIsLoading(false);
    };

    fetchData();
  }, [targetDate]);


  if (!targetDate) {
    return (
       <div className="flex min-h-screen w-full flex-col">
          <PageHeader 
            title="Painel de Cotações"
            description="Carregando dados..."
          >
            <Skeleton className="h-9 w-[250px]" />
          </PageHeader>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
              <Skeleton className="h-96 w-full" />
          </main>
      </div>
    );
  }

  const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader 
        title="Painel de Cotações"
        description={isCurrentDateOrFuture 
            ? "Cotações em tempo real dos principais ativos." 
            : `Exibindo cotações para: ${formattedDate}`
        }
      >
        <DateNavigator
          targetDate={targetDate}
        />
      </PageHeader>
      <CommodityPrices 
        initialData={data} 
        displayDate={isCurrentDateOrFuture ? 'Tempo Real' : formattedDate} 
        loading={isLoading}
      />
    </div>
  );
}
