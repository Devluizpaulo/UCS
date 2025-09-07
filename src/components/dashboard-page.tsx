
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, UcsData, HistoryInterval } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getUcsIndexValue } from '@/lib/data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { AnimatedNumber } from './ui/animated-number';
import { IndexCompositionModal } from './index-composition-modal';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { UnderlyingAssetsCard } from './underlying-assets-card';
import { Button } from './ui/button';


const loadingMessages = [
    "Preparando seu painel...",
    "Verificando a estrutura de dados...",
    "Calculando o índice UCS...",
    "Otimizando a visualização...",
    "Quase pronto!",
];

function InitialLoadingScreen({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 bg-background z-50">
            <div className="relative flex items-center justify-center h-48 w-48">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-2 border-4 border-primary/20 rounded-full animate-spin-around [animation-direction:reverse]"></div>
                <Image src="/image/ucs.png" alt="Ícone do Índice UCS" width={128} height={128} className="rounded-full" data-ai-hint="logo abstract" />
            </div>
            <p className="text-lg mt-8 text-muted-foreground animate-pulse">{message}</p>
        </div>
    );
}

export function DashboardPage() {
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const { toast } = useToast();
  const [isInitialising, setIsInitialising] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyInterval, setHistoryInterval] = useState<HistoryInterval>('1d');
  const [indexHistoryData, setIndexHistoryData] = useState<ChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
      try {
        const ucsResult = await getUcsIndexValue();
        setUcsData(ucsResult.latest);
        setIndexHistoryData(ucsResult.history); // Initial history (daily)
        return ucsResult.latest.isConfigured;
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar dados",
          description: "Não foi possível obter os dados do banco de dados.",
        });
        return false;
      }
  }, [toast]);

  useEffect(() => {
    let messageInterval: NodeJS.Timeout | undefined;

    const initialFetch = async () => {
        setIsInitialising(true);
        let messageIndex = 0;
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2000);

        try {
            await fetchDashboardData();
        } catch (error: any) {
             console.error('Initial data fetch failed:', error);
             toast({ variant: 'destructive', title: 'Falha na Busca de Dados', description: "Não foi possível buscar os dados. Verifique a conexão e tente atualizar." });
        } finally {
            if (messageInterval) {
                clearInterval(messageInterval);
            }
            setIsInitialising(false);
        }
    };
    
    initialFetch();

    return () => {
        if (messageInterval) {
            clearInterval(messageInterval)
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleIntervalChange = useCallback(async (interval: HistoryInterval) => {
    setHistoryInterval(interval);
    if(!ucsData?.isConfigured) return;
    setLoadingHistory(true);
    try {
        const result = await getUcsIndexValue(interval);
        setIndexHistoryData(result.history);
    } catch (error) {
        console.error(`Failed to fetch index history for interval ${interval}:`, error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar histórico",
            description: "Não foi possível carregar os dados históricos da tabela.",
        });
    } finally {
        setLoadingHistory(false);
    }
  }, [toast, ucsData?.isConfigured]);

  const latestValue = ucsData?.indexValue ?? 0;
  const isConfigured = ucsData?.isConfigured ?? false;
  const isLoading = isInitialising && !ucsData;

  return (
    <div className="flex min-h-screen w-full flex-col relative">
       {isInitialising && <InitialLoadingScreen message={loadingMessage} />}
      <PageHeader title="Painel" />
      <main className={`flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 transition-opacity duration-500 ${isInitialising ? 'opacity-0' : 'opacity-100'}`}>
       
        {!isLoading && !isConfigured && (
            <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Ação Necessária: Configure a Fórmula</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>A fórmula do Índice UCS ainda não foi configurada. O valor do índice não será calculado até que os parâmetros sejam salvos.</span>
                    <Button asChild variant="outline" size="sm" className="ml-4">
                        <Link href="/settings">
                            Ir para Configurações
                        </Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card 
                className="lg:col-span-4 border-border/60 bg-card/50"
            >
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Índice UCS</CardTitle>
                         <div 
                            className="flex items-center gap-4 mt-2 cursor-pointer"
                            onClick={() => isConfigured && setIsModalOpen(true)}
                          >
                            <Image src="/image/ucs.png" alt="Moeda UCS" width={64} height={64} className="rounded-full" data-ai-hint="logo abstract" />
                            <div className="text-5xl md:text-6xl font-bold text-primary">
                                {isLoading ? (
                                    <Skeleton className="h-16 w-64" />
                                ) : (
                                    <AnimatedNumber value={latestValue} formatter={(v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/>
                                )}
                            </div>
                        </div>
                        <CardDescription className="mt-2">
                             {isConfigured ? "Clique nos valores para ver a composição detalhada do índice." : "Aguardando configuração da fórmula"}
                        </CardDescription>
                     </div>
                     <Tabs defaultValue={historyInterval} onValueChange={(value) => handleIntervalChange(value as HistoryInterval)} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="1d" disabled={!isConfigured}>Diário</TabsTrigger>
                            <TabsTrigger value="1wk" disabled={!isConfigured}>Semanal</TabsTrigger>
                            <TabsTrigger value="1mo" disabled={!isConfigured}>Anual</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="pl-2">
                    <UcsIndexChart data={indexHistoryData} loading={loadingHistory || isLoading || !isConfigured}/>
                </CardContent>
            </Card>

            <div className="lg:col-span-3">
                <UnderlyingAssetsCard 
                    indexHistory={indexHistoryData} 
                    loadingIndexHistory={loadingHistory || isLoading}
                    isConfigured={isConfigured}
                />
            </div>
        </div>

        {isModalOpen && ucsData && (
            <IndexCompositionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={ucsData}
            />
        )}
      </main>
    </div>
  );
}
