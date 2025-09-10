
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { UnderlyingAssetsTable } from "./underlying-assets-table";
import { useToast } from "@/hooks/use-toast";
import type { CommodityPriceData, ChartData, UcsData } from "@/lib/types";
import { IndexHistoryTable } from './index-history-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getCommodityPrices, getUcsIndexValue } from '@/lib/data-service';

interface UnderlyingAssetsCardProps {
    selectedDate?: string; // YYYY-MM-DD
}


export function UnderlyingAssetsCard({ selectedDate }: UnderlyingAssetsCardProps) {
    const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
    const [isLoadingCommodities, setIsLoadingCommodities] = useState(true);
    const [indexHistory, setIndexHistory] = useState<ChartData[]>([]);
    const [loadingIndexHistory, setLoadingIndexHistory] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);
    const { toast } = useToast();

    const fetchAssetsAndHistory = useCallback(async (date?: string) => {
        setIsLoadingCommodities(true);
        setLoadingIndexHistory(true);
        try {
            const [pricesResult, historyResult] = await Promise.all([
                getCommodityPrices(date),
                getUcsIndexValue('1d', date)
            ]);

            setCommodities(pricesResult);
            setIndexHistory(historyResult.history);
            setIsConfigured(historyResult.latest.isConfigured);
            
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro ao buscar dados",
                description: "Não foi possível carregar os dados do painel.",
            });
        } finally {
            setIsLoadingCommodities(false);
            setLoadingIndexHistory(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAssetsAndHistory(selectedDate);
    }, [selectedDate, fetchAssetsAndHistory]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mercado Subjacente</CardTitle>
                <CardDescription>Visão geral dos ativos e do histórico do índice.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="assets">
                    <TabsList className="px-6">
                        <TabsTrigger value="assets">Visão Geral dos Ativos</TabsTrigger>
                        <TabsTrigger value="index_history">Histórico do Índice</TabsTrigger>
                    </TabsList>
                    <TabsContent value="assets" className="mt-0">
                        <UnderlyingAssetsTable 
                            data={commodities} 
                            loading={isLoadingCommodities}
                        />
                    </TabsContent>
                    <TabsContent value="index_history" className="mt-0">
                         <IndexHistoryTable 
                            data={indexHistory} 
                            loading={loadingIndexHistory} 
                            isConfigured={isConfigured} 
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
