
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { PieChart, Loader2 } from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import { isToday, isFuture, parseISO, isValid } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { CompositionChart } from '@/components/composition-chart';
import { CALCULATION_CONFIGS } from '@/lib/calculation-service';


function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

function useUcsComposition(targetDate: Date | null) {
    const [data, setData] = useState<CommodityPriceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!targetDate) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        // A função getCommodityPricesByDate já otimiza e calcula se necessário
        getCommodityPricesByDate(targetDate)
            .then(setData)
            .catch(err => {
                console.error("Falha ao buscar composição", err);
                setData([]);
            })
            .finally(() => setIsLoading(false));
        
    }, [targetDate]);

    const ucsAsset = useMemo(() => data.find(d => d.id === 'ucs'), [data]);
    const ucsCompositionConfig = CALCULATION_CONFIGS['ucs'];

    const compositionData = useMemo(() => {
        if (!ucsAsset) return [];
        
        // A cotação salva do UCS já contém os valores dos componentes usados no cálculo
        const componentValues = ucsAsset as unknown as Record<string, number>;
        
        return ucsCompositionConfig.components.map(componentId => {
            const componentAsset = data.find(d => d.id === componentId);
            const value = componentValues[componentId] || 0;
            return {
                name: componentAsset?.name || componentId,
                value: value,
                currency: componentAsset?.currency || 'BRL',
                id: componentId,
            };
        }).filter(item => item.id !== 'usd'); // Filtra o dólar para não aparecer no gráfico

    }, [ucsAsset, data, ucsCompositionConfig]);

    return { ucsAsset, compositionData, isLoading };
}


export default function CompositionPage() {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');

    const [targetDate, setTargetDate] = useState<Date | null>(null);

    useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);

    const { ucsAsset, compositionData, isLoading } = useUcsComposition(targetDate);
    
    const isCurrentDateOrFuture = targetDate ? isToday(targetDate) || isFuture(targetDate) : true;
    const description = isCurrentDateOrFuture
        ? "Visualização da composição do Índice UCS em tempo real."
        : `Composição do Índice UCS para a data selecionada.`;

    if (!targetDate) {
        return (
             <div className="flex min-h-screen w-full flex-col">
                 <PageHeader 
                    title="Análise de Composição"
                    description="Carregando..."
                    icon={PieChart}
                >
                    <Skeleton className="h-9 w-[250px]" />
                </PageHeader>
                <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-6">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader
                title="Análise de Composição"
                description={description}
                icon={PieChart}
            >
                 <DateNavigator targetDate={targetDate} />
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
               <CompositionChart 
                    ucsAsset={ucsAsset}
                    compositionData={compositionData}
                    isLoading={isLoading}
               />
            </main>
        </div>
    );
}

