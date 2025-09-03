
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, UcsData, HistoryInterval } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getUcsIndexValue } from '@/lib/data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { IndexHistoryTable } from './index-history-table';
import { Skeleton } from './ui/skeleton';
import { AnimatedNumber } from './ui/animated-number';
import { IndexCompositionModal } from './index-composition-modal';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { UnderlyingAssetsCard } from './underlying-assets-card';
import { useRouter } from 'next/navigation';


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
                <Image src="/image/ucs.png" alt="Ícone do Índice UCS" width={128} height={128} className="rounded-full" />
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
  const router = useRouter();


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
      <PageHeader title="Painel">
        <Button onClick={() => router.push('/update-prices')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Preços
        </Button>
      </PageHeader>
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

        <Card 
            className="border-border/60 bg-card/50 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => isConfigured && setIsModalOpen(true)}
        >
            <div className="p-6">
                 <CardTitle className="text-sm text-muted-foreground font-medium tracking-wider uppercase">Índice UCS</CardTitle>
                 {isLoading ? (
                    <Skeleton className="h-16 w-full max-w-xs mt-2" />
                 ) : (
                    <div className="flex items-center gap-4">
                        <Image src="/image/ucs.png" alt="Moeda UCS" width={64} height={64} className="rounded-full" />
                        <div className="text-5xl md:text-6xl font-bold text-primary">
                            <AnimatedNumber value={latestValue} formatter={(v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/>
                        </div>
                    </div>
                 )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {isConfigured ? "Powered by bmv.global" : "Aguardando configuração da fórmula"}
                  </p>
            </div>
        </Card>
        {isModalOpen && ucsData && (
            <IndexCompositionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={ucsData}
            />
        )}


        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
             <AccordionItem value="item-1" className="border-none">
                 <Card>
                    <AccordionTrigger className="w-full flex justify-between p-6 text-left hover:no-underline">
                        <CardHeader className="p-0 text-left">
                            <CardTitle>Histórico do Índice</CardTitle>
                            <CardDescription>Performance do Índice UCS.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                             <div className="flex justify-end mb-4">
                                <Tabs defaultValue={historyInterval} onValueChange={(value) => handleIntervalChange(value as HistoryInterval)} className="w-auto">
                                    <TabsList>
                                        <TabsTrigger value="1d" disabled={!isConfigured}>Diário</TabsTrigger>
                                        <TabsTrigger value="1wk" disabled={!isConfigured}>Semanal</TabsTrigger>
                                        <TabsTrigger value="1mo" disabled={!isConfigured}>Anual</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <UcsIndexChart data={indexHistoryData} loading={loadingHistory || !isConfigured}/>
                        </CardContent>
                    </AccordionContent>
                </Card>
             </AccordionItem>
             
             <AccordionItem value="item-2" className="border-none">
                <UnderlyingAssetsCard onDataChange={fetchDashboardData}/>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-none">
                 <Card>
                    <AccordionTrigger className="w-full flex justify-between p-6 text-left hover:no-underline">
                        <CardHeader className="p-0 text-left">
                           <CardTitle>Tabela Histórica de Cotações</CardTitle>
                           <CardDescription>Valores de fechamento do Índice UCS.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                            <IndexHistoryTable data={indexHistoryData} loading={loadingHistory} isConfigured={isConfigured} />
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
      </main>
    </div>
  );
}
