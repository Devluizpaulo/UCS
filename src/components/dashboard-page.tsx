
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, ChevronDown, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import type { ChartData, CommodityPriceData, UcsData, HistoryInterval } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCommodityPrices, getUcsIndexValue, updateSingleCommodity } from '@/lib/data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { UnderlyingAssetsTable } from './underlying-assets-table';
import { IndexHistoryTable } from './index-history-table';
import { Skeleton } from './ui/skeleton';
import { AnimatedNumber } from './ui/animated-number';
import { IndexCompositionModal } from './index-composition-modal';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';


export function DashboardPage() {
  const [ucsData, setUcsData] = useState<UcsData | null>(null);
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyInterval, setHistoryInterval] = useState<HistoryInterval>('1d');
  const [indexHistoryData, setIndexHistoryData] = useState<ChartData[]>([]);
  const [updatingAssets, setUpdatingAssets] = useState<Set<string>>(new Set());


  const fetchDashboardData = useCallback(async () => {
      setLoading(true);
      try {
        const [ucsResult, pricesResult] = await Promise.all([
          getUcsIndexValue(),
          getCommodityPrices()
        ]);
        
        setUcsData(ucsResult.latest);
        setCommodities(pricesResult);
        setIndexHistoryData(ucsResult.history); // Set initial history from the main call

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Erro ao buscar dados",
          description: "Não foi possível obter os dados do banco de dados.",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  const handleManualUpdate = useCallback(async (assetName: string) => {
    setUpdatingAssets(prev => new Set(prev).add(assetName));
    toast({ title: 'Atualizando...', description: `Buscando a cotação mais recente para ${assetName}.` });
    try {
        const result = await updateSingleCommodity(assetName);
        if (result.success) {
            toast({ title: 'Sucesso!', description: result.message });
            // Refetch all data to ensure consistency
            await fetchDashboardData();
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        console.error(`Manual update for ${assetName} failed:`, error);
        toast({ variant: 'destructive', title: 'Falha na Atualização', description: error.message });
    } finally {
        setUpdatingAssets(prev => {
            const next = new Set(prev);
            next.delete(assetName);
            return next;
        });
    }
  }, [toast, fetchDashboardData]);


  const fetchIndexHistory = useCallback(async (interval: HistoryInterval) => {
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
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    // Only fetch history on interval change if it's not the initial '1d' load
    // and if the formula is configured.
    if (ucsData?.isConfigured) {
        fetchIndexHistory(historyInterval);
    }
  }, [historyInterval, fetchIndexHistory, ucsData?.isConfigured]);
  
  const latestValue = ucsData?.indexValue ?? 0;
  const isConfigured = ucsData?.isConfigured ?? false;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader title="Painel" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
       
        {!loading && !isConfigured && (
            <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Ação Necessária</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>A fórmula do Índice UCS ainda não foi configurada. O valor do índice não será calculado até que os parâmetros sejam salvos.</span>
                    <Button asChild variant="outline" size="sm" className="ml-4">
                        <Link href="/settings">
                            Configurar Fórmula
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
                 {loading && !ucsData ? (
                    <Skeleton className="h-16 w-full max-w-xs mt-2" />
                 ) : (
                    <div className="flex items-center gap-4">
                        <Image src="/image/currency.png" alt="Moeda UCS" width={64} height={64} className="rounded-full" />
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
                    <AccordionTrigger className="p-6 text-left">
                        <CardHeader className="p-0">
                            <CardTitle>Histórico do Índice</CardTitle>
                            <CardDescription>Performance do Índice UCS nos últimos 30 dias.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                            <UcsIndexChart data={indexHistoryData} loading={loading || !isConfigured}/>
                        </CardContent>
                    </AccordionContent>
                </Card>
             </AccordionItem>
             
             <AccordionItem value="item-2" className="border-none">
                <Card>
                     <AccordionTrigger className="p-6 text-left">
                        <CardHeader className="p-0">
                            <CardTitle>Ativos Subjacentes</CardTitle>
                            <CardDescription>Cotações de fechamento diário. Clique em recarregar para obter o preço em tempo real.</CardDescription>
                        </CardHeader>
                     </AccordionTrigger>
                     <AccordionContent>
                        <CardContent>
                            <UnderlyingAssetsTable 
                                data={commodities} 
                                loading={loading}
                                updatingAssets={updatingAssets}
                                onManualUpdate={handleManualUpdate}
                            />
                        </CardContent>
                     </AccordionContent>
                </Card>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-none">
                <Card>
                    <AccordionTrigger className="p-6 w-full">
                         <div className="flex flex-row items-center justify-between w-full">
                            <div>
                                <CardTitle className="text-left">Histórico de Cotações do Índice</CardTitle>
                                <CardDescription className="text-left">Valores de fechamento do Índice UCS.</CardDescription>
                            </div>
                            <Tabs defaultValue="1d" onValueChange={(value) => setHistoryInterval(value as HistoryInterval)} className="w-auto" onClick={(e) => e.stopPropagation()}>
                                <TabsList>
                                    <TabsTrigger value="1d" disabled={!isConfigured}>Diário</TabsTrigger>
                                    <TabsTrigger value="1wk" disabled={!isConfigured}>Semanal</TabsTrigger>
                                    <TabsTrigger value="1mo" disabled={!isConfigured}>Mensal</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
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
