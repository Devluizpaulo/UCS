
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { AccordionTrigger, AccordionContent } from "./ui/accordion";
import { UnderlyingAssetsTable } from "./underlying-assets-table";
import { useToast } from "@/hooks/use-toast";
import type { CommodityPriceData } from "@/lib/types";
import { getCommodityPrices } from "@/lib/data-service";


async function runFetchAndSavePrices(assetName?: string): Promise<{success: boolean, message: string}> {
    const { fetchAndSavePrices } = await import('@/ai/flows/fetch-and-save-prices-flow');
    return fetchAndSavePrices({ assetName });
}


export function UnderlyingAssetsCard({ onDataChange }: { onDataChange: () => void }) {
    const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingAssets, setUpdatingAssets] = useState<Set<string>>(new Set());
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

    const handleManualUpdate = useCallback(async (assetName: string) => {
        setUpdatingAssets(prev => new Set(prev).add(assetName));
        toast({ title: 'Atualizando...', description: `Buscando a cotação mais recente para ${assetName}.` });
        try {
            const result = await runFetchAndSavePrices(assetName);
            if (result.success) {
                toast({ title: 'Sucesso!', description: result.message });
                await fetchAssets(); // Refresh just this component's data
                onDataChange(); // Notify parent to refresh index data
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
    }, [toast, fetchAssets, onDataChange]);


    return (
        <Card>
             <AccordionTrigger className="w-full flex justify-between p-6 text-left hover:no-underline">
                <CardHeader className="p-0 text-left">
                    <CardTitle>Ativos Subjacentes</CardTitle>
                    <CardDescription>Cotações de fechamento diário. Clique em recarregar para obter o preço em tempo real.</CardDescription>
                </CardHeader>
             </AccordionTrigger>
             <AccordionContent>
                <CardContent>
                    <UnderlyingAssetsTable 
                        data={commodities} 
                        loading={isLoading}
                        updatingAssets={updatingAssets}
                        onManualUpdate={handleManualUpdate}
                    />
                </CardContent>
             </AccordionContent>
        </Card>
    );
}
