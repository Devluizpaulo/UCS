'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { LandPlot, Loader2, Wheat, Bean, Beef, TreePine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteByDate } from '@/lib/data-service';
import * as Calc from '@/lib/calculation-service';
import { formatCurrency } from '@/lib/formatters';
import type { FirestoreQuote } from '@/lib/types';

interface ProfitabilityData {
    soja: number;
    milho: number;
    boi: number;
    madeira: number;
}

const ProfitabilityCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(value, 'BRL', 'rentabilidade')}</div>
            <p className="text-xs text-muted-foreground">em BRL/hectare</p>
        </CardContent>
    </Card>
);

function useProfitability() {
    const [profitability, setProfitability] = useState<ProfitabilityData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalculate = async () => {
            setIsLoading(true);
            try {
                const today = new Date();
                const requiredAssets = ['soja', 'milho', 'boi_gordo', 'madeira', 'usd'];
                
                const quotePromises = requiredAssets.map(id => getQuoteByDate(id, today));
                const quotes = await Promise.all(quotePromises);
                
                const quoteMap = requiredAssets.reduce((acc, id, index) => {
                    acc[id] = quotes[index];
                    return acc;
                }, {} as Record<string, FirestoreQuote | null>);

                const values = {
                    soja: quoteMap['soja']?.ultimo ?? 0,
                    milho: quoteMap['milho']?.ultimo ?? 0,
                    boi_gordo: quoteMap['boi_gordo']?.ultimo ?? 0,
                    madeira: quoteMap['madeira']?.ultimo ?? 0,
                    usd: quoteMap['usd']?.ultimo ?? 0,
                };
                
                const rentSoja = Calc.calculateRentMediaSoja(values.soja, values.usd);
                const rentMilho = Calc.calculateRentMediaMilho(values.milho);
                const rentBoi = Calc.calculateRentMediaBoi(values.boi_gordo);
                const rentMadeira = Calc.calculateRentMediaMadeira(values.madeira, values.usd);

                setProfitability({
                    soja: rentSoja,
                    milho: rentMilho,
                    boi: rentBoi,
                    madeira: rentMadeira,
                });

            } catch (err) {
                console.error("Failed to calculate profitability:", err);
                setProfitability(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndCalculate();
    }, []);

    return { profitability, isLoading };
}


export default function ProfitabilityPage() {
    const { profitability, isLoading } = useProfitability();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader
                title="Análise de Rentabilidade Média"
                description="Compare a performance econômica das principais atividades por hectare."
                icon={LandPlot}
            />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                ) : profitability ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <ProfitabilityCard title="Rentabilidade da Soja" value={profitability.soja} icon={Bean} />
                        <ProfitabilityCard title="Rentabilidade do Milho" value={profitability.milho} icon={Wheat} />
                        <ProfitabilityCard title="Rentabilidade do Boi" value={profitability.boi} icon={Beef} />
                        <ProfitabilityCard title="Rentabilidade da Madeira" value={profitability.madeira} icon={TreePine} />
                    </div>
                ) : (
                     <div className="flex justify-center items-center h-64">
                        <p className="text-muted-foreground">Não foi possível calcular a rentabilidade. Verifique se os dados de hoje estão disponíveis.</p>
                    </div>
                )}
                 <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Sobre a Rentabilidade Média</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>A "Rentabilidade Média" é um cálculo intermediário que normaliza o valor de mercado de diferentes commodities para uma unidade comum: <span className="font-semibold text-foreground">Reais (BRL) por Hectare</span>.</p>
                        <p>Isso permite uma comparação direta da performance econômica de cada cultura, independentemente de suas unidades de medida originais (saca, arroba, m³, etc.). Este valor é a base para o cálculo dos índices `VUS` e `VMAD`.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
