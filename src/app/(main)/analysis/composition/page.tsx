
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

// Define estaticamente quais são os componentes diretos que formam o índice principal.
// A lógica busca o valor de cada um desses IDs para compor o gráfico.
const STATIC_UCS_COMPONENTS = ['ucs', 'pdm'] as const;

/**
 * Valida uma string de data da URL e a converte para um objeto Date.
 * Retorna nulo se a data for inválida.
 * @param dateString A string da data (ex: '2024-08-01').
 * @returns Um objeto Date ou nulo.
 */
function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}


/**
 * Hook customizado para buscar os dados de composição do Índice UCS para uma data específica.
 * @param targetDate A data para a qual a composição deve ser buscada.
 * @returns O ativo principal (UCS ASE), os dados de seus componentes e o estado de carregamento.
 */
function useUcsComposition(targetDate: Date | null) {
    const [ucsAsset, setUcsAsset] = useState<FirestoreQuote | null>(null);
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
                // Etapa 1: Busca a cotação principal do 'ucs_ase' para obter o valor total de referência.
                const ucsQuote = await getQuoteByDate('ucs_ase', targetDate);
                setUcsAsset(ucsQuote);

                if (!ucsQuote) {
                    setCompositionData([]);
                    return;
                }
                
                // Etapa 2: Busca o valor de cada um dos componentes definidos em STATIC_UCS_COMPONENTS para a mesma data.
                const componentPromises = STATIC_UCS_COMPONENTS
                    .map(async (componentId) => {
                        const componentQuote = await getQuoteByDate(componentId, targetDate);
                        return {
                            name: componentQuote?.name || componentQuote?.ativo || componentId,
                            value: componentQuote?.ultimo || 0,
                            currency: componentQuote?.moeda || 'BRL',
                            id: componentId,
                        };
                    });

                // Aguarda a busca de todos os componentes e filtra aqueles que têm valor.
                const resolvedComponents = await Promise.all(componentPromises);
                setCompositionData(resolvedComponents.filter(c => c.value > 0));

            } catch (err) {
                console.error("Falha ao buscar composição do UCS", err);
                setCompositionData([]);
                setUcsAsset(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        
    }, [targetDate]);
    
    // Memoiza a transformação do ativo UCS para o formato esperado pelo CompositionChart.
    const ucsAssetForChart: CommodityPriceData | undefined = useMemo(() => {
        if (!ucsAsset) return undefined;
        return {
            id: 'ucs_ase',
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

    // Efeito para inicializar a data no lado do cliente, evitando erros de hidratação.
    useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);

    // Busca os dados de composição usando o hook customizado.
    const { ucsAsset, compositionData, isLoading } = useUcsComposition(targetDate);
    
    const isCurrentDateOrFuture = targetDate ? isToday(targetDate) || isFuture(targetDate) : true;
    const description = isCurrentDateOrFuture
        ? "Visualização da composição do Índice UCS em tempo real."
        : `Composição do Índice UCS para a data selecionada.`;

    // Renderiza um loader enquanto a data inicial não é definida no cliente.
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

    // Renderiza a página principal com os dados.
    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader
                title="Análise de Composição do UCS"
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
