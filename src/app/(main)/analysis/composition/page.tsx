
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
import { getAssetCompositionConfig } from '@/lib/calculation-service';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

function usePdmComposition(targetDate: Date | null) {
    const [pdmAsset, setPdmAsset] = useState<FirestoreQuote | null>(null);
    const [compositionData, setCompositionData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!targetDate) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const fetchData = async () => {
            try {
                // Busca o PDM principal para a data
                const pdmQuote = await getQuoteByDate('pdm', targetDate);
                setPdmAsset(pdmQuote);

                if (!pdmQuote) {
                    setCompositionData([]);
                    return;
                }
                
                // Busca a configuração de composição para o PDM
                const componentIds = await getAssetCompositionConfig('pdm');

                // Busca os dados de cotação para cada componente
                const componentPromises = componentIds
                    .map(async (componentId) => {
                        const componentQuote = await getQuoteByDate(componentId, targetDate);
                        return {
                            name: componentQuote?.name || componentQuote?.ativo || componentId,
                            value: componentQuote?.ultimo || 0,
                            currency: componentQuote?.moeda || 'BRL',
                            id: componentId,
                        };
                    });

                const resolvedComponents = await Promise.all(componentPromises);
                setCompositionData(resolvedComponents.filter(c => c.value > 0));

            } catch (err) {
                console.error("Falha ao buscar composição do PDM", err);
                setCompositionData([]);
                setPdmAsset(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
    }, [targetDate]);
    
    // Transforma a cotação do PDM em um formato que o CompositionChart espera
    const pdmAssetForChart: CommodityPriceData | undefined = useMemo(() => {
        if (!pdmAsset) return undefined;
        return {
            id: 'pdm',
            name: 'Índice PDM',
            price: pdmAsset.ultimo,
            currency: 'BRL',
            category: 'index',
            description: 'Potencial Desflorestador Monetizado',
            unit: 'Pontos',
            change: 0,
            absoluteChange: 0,
            lastUpdated: pdmAsset.data,
        };
    }, [pdmAsset]);


    return { ucsAsset: pdmAssetForChart, compositionData, isLoading };
}


export default function CompositionPage() {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');

    const [targetDate, setTargetDate] = useState<Date | null>(null);

    useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);

    const { ucsAsset, compositionData, isLoading } = usePdmComposition(targetDate);
    
    const isCurrentDateOrFuture = targetDate ? isToday(targetDate) || isFuture(targetDate) : true;
    const description = isCurrentDateOrFuture
        ? "Visualização da composição do Índice PDM em tempo real."
        : `Composição do Índice PDM para a data selecionada.`;

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
                title="Análise de Composição do PDM"
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