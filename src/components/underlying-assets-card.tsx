
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { AccordionTrigger, AccordionContent } from "./ui/accordion";
import { UnderlyingAssetsTable } from "./underlying-assets-table";
import { useToast } from "@/hooks/use-toast";
import type { CommodityPriceData } from "@/lib/types";
import { getCommodityPrices } from "@/lib/data-service";

export function UnderlyingAssetsCard({ onDataChange }: { onDataChange: () => void }) {
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

    return (
        <Card>
             <AccordionTrigger className="w-full flex justify-between p-6 text-left hover:no-underline">
                <CardHeader className="p-0 text-left">
                    <CardTitle>Ativos Subjacentes</CardTitle>
                    <CardDescription>Cotações de fechamento diário.</CardDescription>
                </CardHeader>
             </AccordionTrigger>
             <AccordionContent>
                <CardContent>
                    <UnderlyingAssetsTable 
                        data={commodities} 
                        loading={isLoading}
                    />
                </CardContent>
             </AccordionContent>
        </Card>
    );
}
