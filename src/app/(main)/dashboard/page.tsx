
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { addDays, format, parseISO, isValid, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateNavigator } from '@/components/date-navigator';
import { Skeleton } from '@/components/ui/skeleton';
import { MainIndexCard } from '@/components/main-index-card';
import type { CommodityPriceData } from '@/lib/types';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

function useRealtimeData(initialDate: Date | null) {
    const [data, setData] = useState<CommodityPriceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isCurrentDateOrFuture = initialDate ? isToday(initialDate) || isFuture(initialDate) : true;

    useEffect(() => {
        if (!initialDate) return;

        let intervalId: NodeJS.Timeout | undefined;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                const result = isCurrentDateOrFuture
                    ? await getCommodityPrices()
                    : await getCommodityPricesByDate(initialDate);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Optionally set an error state here
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        if (isCurrentDateOrFuture) {
            // Poll for new data every 30 seconds for "real-time" feel
            intervalId = setInterval(fetchData, 30000); 
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

    }, [initialDate, isCurrentDateOrFuture]);

    return { data, isLoading };
}


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  // Initialize state with null to ensure server and client match initially.
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  
  useEffect(() => {
    // This effect runs only on the client, after hydration.
    // It safely sets the initial date based on the URL or defaults to today.
    // This prevents the hydration mismatch error caused by new Date().
    const initialDate = getValidatedDate(dateParam) || new Date();
    setTargetDate(initialDate);
  }, [dateParam]);
  
  const { data, isLoading } = useRealtimeData(targetDate);
  
  const { mainIndices, otherAssets } = useMemo(() => {
    const main = data.filter(d => d.category === 'index' && d.id !== 'ucs_ase').sort((a, b) => a.name.localeCompare(b.name));
    const secondary = data.filter(d => d.category !== 'index');
    return { mainIndices: main, otherAssets: secondary };
  }, [data]);
  
  const ucsAseAsset = useMemo(() => data.find(d => d.id === 'ucs_ase'), [data]);

  // Render a loading skeleton if the date hasn't been set on the client yet.
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
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
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
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isLoading && data.length === 0 ? (
          <>
            <Skeleton className="h-[180px] w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </>
        ) : (
          <>
            {ucsAseAsset && <MainIndexCard asset={ucsAseAsset} isMain />}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {mainIndices.map(asset => <MainIndexCard key={asset.id} asset={asset} />)}
            </div>
          </>
        )}
        <CommodityPrices 
          data={otherAssets} 
          displayDate={isCurrentDateOrFuture ? 'Tempo Real' : formattedDate} 
          loading={isLoading && otherAssets.length === 0}
        />
      </main>
    </div>
  );
}
