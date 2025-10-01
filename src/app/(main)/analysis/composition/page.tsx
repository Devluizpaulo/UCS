
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

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

// Componentes que formam o "Valor Uso Solo" conforme a nova documentação
const BASE_COMPONENTS = ['vus', 'vmad', 'carbono_crs', 'Agua_CRS'] as const;

function useComposition(targetDate: Date | null) {
    const [mainAsset, setMainAsset] = useState<FirestoreQuote | null>(null);
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
                // Busca o índice "Valor Uso Solo" para a data
                const mainQuote = await getQuoteByDate('valor_uso_solo', targetDate);
                setMainAsset(mainQuote);

                if (!mainQuote) {
                    setCompositionData([]);
                    return;
                }
                
                // Busca os dados de cotação para cada componente
                const componentPromises = BASE_COMPONENTS
                    .map(async (componentId) => {
                        const componentQuote = await getQuoteByDate(componentId, targetDate);
                        return {
                            name: componentQuote?.ativo || componentQuote?.name || componentId.toUpperCase(),
                            value: componentQuote?.ultimo || componentQuote?.valor || 0,
                            currency: componentQuote?.moeda || 'BRL',
                            id: componentId,
                        };
                    });

                const resolvedComponents = await Promise.all(componentPromises);
                setCompositionData(resolvedComponents.filter(c => c.value > 0));

            } catch (err) {
                console.error("Falha ao buscar composição do Valor Uso Solo", err);
                setCompositionData([]);
                setMainAsset(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
    }, [targetDate]);
    
    const mainAssetForChart: CommodityPriceData | undefined = useMemo(() => {
        if (!mainAsset) return undefined;
        return {
            id: 'valor_uso_solo',
            name: 'Valor Uso Solo',
            price: mainAsset.valor ?? mainAsset.ultimo,
            currency: 'BRL',
            category: 'index',
            description: 'Valor total do uso do solo, composto por VUS, VMAD, Carbono CRS e Água CRS.',
            unit: 'BRL',
            change: 0,
            absoluteChange: 0,
            lastUpdated: mainAsset.data,
        };
    }, [mainAsset]);


    return { mainAsset: mainAssetForChart, compositionData, isLoading };
}


export default function CompositionPage() {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');

    const [targetDate, setTargetDate] = useState<Date | null>(null);

    useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);

    const { mainAsset, compositionData, isLoading } = useComposition(targetDate);
    
    const isCurrentDateOrFuture = targetDate ? isToday(targetDate) || isFuture(targetDate) : true;
    const description = isCurrentDateOrFuture
        ? "Visualização da composição do Valor de Uso do Solo em tempo real."
        : `Composição do Valor de Uso do Solo para a data selecionada.`;

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
                title="Composição do Valor de Uso do Solo"
                description={description}
                icon={PieChart}
            >
                 <DateNavigator targetDate={targetDate} />
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
               <CompositionChart 
                    mainAsset={mainAsset}
                    compositionData={compositionData}
                    isLoading={isLoading}
                    targetDate={targetDate}
               />
            </main>
        </div>
    );
}
