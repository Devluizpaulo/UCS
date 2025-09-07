
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { UnderlyingAssetsTable } from "./underlying-assets-table";
import { useToast } from "@/hooks/use-toast";
import type { CommodityPriceData, ChartData } from "@/lib/types";
import { getCommodityPrices } from "@/lib/data-service";
import { IndexHistoryTable } from './index-history-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CotacoesHistorico } from './cotacoes-historico';

interface UnderlyingAssetsCardProps {
    indexHistory: ChartData[];
    loadingIndexHistory: boolean;
    isConfigured: boolean;
}

export function UnderlyingAssetsCard({ indexHistory, loadingIndexHistory, isConfigured }: UnderlyingAssetsCardProps) {
    const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const pricesResult = await getCommodityPrices();
            setCommodities(pricesResult);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro ao buscar ativos",
                description: "Não foi possível carregar as cotações das commodities.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);
    
    const availableAtivos = commodities.map(c => c.name);

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
                        <TabsTrigger value="data_source">Fonte de Dados (n8n)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="assets" className="px-6 pb-6">
                        <UnderlyingAssetsTable 
                            data={commodities} 
                            loading={isLoading}
                        />
                    </TabsContent>
                    <TabsContent value="index_history" className="px-6 pb-6">
                         <IndexHistoryTable 
                            data={indexHistory} 
                            loading={loadingIndexHistory} 
                            isConfigured={isConfigured} 
                        />
                    </TabsContent>
                     <TabsContent value="data_source" className="px-6 pb-6">
                        <CotacoesHistorico ativos={availableAtivos} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
