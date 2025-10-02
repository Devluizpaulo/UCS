
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { PieChart, Loader2 } from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { getQuoteByDate, getCommodityConfigs } from '@/lib/data-service';
import type { CommodityPriceData, FirestoreQuote, CommodityConfig } from '@/lib/types';
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

function useComposition(targetDate: Date | null) {
    const [mainQuote, setMainQuote] = useState<FirestoreQuote | null>(null);
    const [compositionData, setCompositionData] = useState<any[]>([]);
    const [allConfigs, setAllConfigs] = useState<Record<string, CommodityConfig>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCommodityConfigs().then(configs => {
            const configMap = configs.reduce((acc, config) => {
                acc[config.id] = config;
                return acc;
            }, {} as Record<string, CommodityConfig>);
            setAllConfigs(configMap);
        });
    }, []);

    useEffect(() => {
        if (!targetDate || Object.keys(allConfigs).length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const fetchData = async () => {
            try {
                // Busca o índice "Valor Uso Solo" para a data
                const quote = await getQuoteByDate('valor_uso_solo', targetDate);
                setMainQuote(quote);

                if (!quote || !quote.componentes) {
                    setCompositionData([]);
                    return;
                }
                
                // Transforma o mapa de componentes em um array para o gráfico
                const components = quote.componentes;
                const resolvedComponents = Object.keys(components).map(componentId => {
                    const config = allConfigs[componentId];
                    return {
                        name: config?.name || componentId.toUpperCase(),
                        value: components[componentId] || 0,
                        currency: config?.currency || 'BRL',
                        id: componentId,
                    };
                });
                
                setCompositionData(resolvedComponents.filter(c => c.value > 0));

            } catch (err) {
                console.error("Falha ao buscar composição do Valor Uso Solo", err);
                setCompositionData([]);
                setMainQuote(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
    }, [targetDate, allConfigs]);
    
    const mainAsset: CommodityPriceData | undefined = useMemo(() => {
        if (!mainQuote) return undefined;
        const config = allConfigs['valor_uso_solo'];
        return {
            id: 'valor_uso_solo',
            name: config?.name || 'Valor Uso Solo',
            price: mainQuote.valor ?? mainQuote.ultimo,
            currency: config?.currency || 'BRL',
            category: config?.category || 'index',
            description: config?.description || 'Valor total do uso do solo, composto por VUS, VMAD, Carbono CRS e Água CRS.',
            unit: config?.unit || 'BRL',
            change: 0,
            absoluteChange: 0,
            lastUpdated: mainQuote.data,
        };
    }, [mainQuote, allConfigs]);


    return { mainAsset, compositionData, isLoading };
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
