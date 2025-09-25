
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { PieChart, Loader2 } from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { getQuoteByDate } from '@/lib/data-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
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
    const [ucsAsset, setUcsAsset] = useState<FirestoreQuote | null>(null);
    const [compositionData, setCompositionData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const ucsCompositionConfig = CALCULATION_CONFIGS['ucs'];

    useEffect(() => {
        if (!targetDate) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const fetchData = async () => {
            try {
                // 1. Fetch the main UCS asset quote for the date
                const ucsQuote = await getQuoteByDate('ucs', targetDate);
                setUcsAsset(ucsQuote);

                if (!ucsQuote) {
                    setCompositionData([]);
                    return;
                }
                
                // 2. Fetch each component to get its rent_media value
                const componentPromises = ucsCompositionConfig.components
                    .filter(id => id !== 'usd') // Exclude USD from composition display
                    .map(async (componentId) => {
                        const componentQuote = await getQuoteByDate(componentId, targetDate);
                        return {
                            name: componentQuote?.ativo || componentId,
                            value: componentQuote?.rent_media || 0,
                            currency: componentQuote?.moeda || 'BRL',
                            id: componentId,
                        };
                    });

                const resolvedComponents = await Promise.all(componentPromises);
                setCompositionData(resolvedComponents);

            } catch (err) {
                console.error("Falha ao buscar composição", err);
                setCompositionData([]);
                setUcsAsset(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
    }, [targetDate, ucsCompositionConfig.components]);
    
    // Create a CommodityPriceData-like object for the chart component
    const ucsAssetForChart: CommodityPriceData | undefined = useMemo(() => {
        if (!ucsAsset) return undefined;
        return {
            id: 'ucs',
            name: 'Índice UCS',
            price: ucsAsset.ultimo,
            currency: 'BRL',
            category: 'index',
            description: '',
            unit: 'Pontos',
            change: 0,
            absoluteChange: 0,
            lastUpdated: ucsAsset.data,
        };
    }, [ucsAsset]);


    return { ucsAsset: ucsAssetForChart, compositionData, isLoading };
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
