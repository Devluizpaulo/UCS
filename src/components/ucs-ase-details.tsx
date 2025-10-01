
'use client';

import { useState, useEffect } from 'react';
import { getQuoteByDate } from '@/lib/data-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Loader2, DollarSign, Euro, Bot } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface UcsAseDetailsProps {
    asset: CommodityPriceData;
}

const DetailRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={`flex justify-between items-center py-2 border-b ${className}`}>
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold font-mono text-right">{value}</span>
    </div>
);

export function UcsAseDetails({ asset }: UcsAseDetailsProps) {
    const [latestQuote, setLatestQuote] = useState<FirestoreQuote | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getQuoteByDate('ucs_ase', new Date())
            .then(quote => {
                setLatestQuote(quote);
            })
            .catch(error => {
                console.error("Failed to fetch UCS ASE details:", error);
                setLatestQuote(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-1/2 mt-4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }
    
    if (!latestQuote) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <Bot className="w-12 h-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">Dados Indisponíveis</p>
                <p className="text-sm text-muted-foreground">Não foi possível carregar os detalhes do cálculo para hoje.</p>
            </div>
        );
    }

    const componentes = latestQuote.componentes || {};
    const valoresOriginais = latestQuote.valores_originais || {};
    const conversoes = latestQuote.conversoes || {};

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Composição do Valor Final</CardTitle>
                    <CardDescription>Valores do dia {latestQuote.data}</CardDescription>
                </CardHeader>
                <CardContent>
                     <DetailRow 
                        label="UCS Original (BRL)" 
                        value={formatCurrency(valoresOriginais.ucs || 0, 'BRL', 'ucs')}
                    />
                    <DetailRow 
                        label="Fórmula Aplicada"
                        value={latestQuote.formula || 'UCS × 2'}
                    />
                     <DetailRow 
                        label="Resultado Final (BRL)" 
                        value={formatCurrency(componentes.resultado_final_brl || asset.price, 'BRL', 'ucs_ase')}
                        className="bg-primary/10"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Conversão para Outras Moedas</CardTitle>
                    <CardDescription>Cotações utilizadas no cálculo de hoje.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div>
                            <p className="font-semibold text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary"/> Dólar (USD)</p>
                            <DetailRow label="Cotação (USD/BRL)" value={formatCurrency(valoresOriginais.cotacao_usd || 0, 'BRL', 'usd')} />
                             <DetailRow 
                                label="Valor Final (USD)" 
                                value={formatCurrency(componentes.resultado_final_usd || 0, 'USD', 'ucs_ase')}
                            />
                        </div>
                        <div>
                             <p className="font-semibold text-sm mb-2 flex items-center gap-2"><Euro className="w-4 h-4 text-primary"/> Euro (EUR)</p>
                             <DetailRow label="Cotação (EUR/BRL)" value={formatCurrency(valoresOriginais.cotacao_eur || 0, 'BRL', 'eur')} />
                             <DetailRow 
                                label="Valor Final (EUR)" 
                                value={formatCurrency(componentes.resultado_final_eur || 0, 'EUR', 'ucs_ase')}
                             />
                        </div>
                    </div>
                     <div className="text-xs text-muted-foreground mt-4 space-y-1">
                        {conversoes.brl_para_usd && <p>Cálculo USD: {conversoes.brl_para_usd}</p>}
                        {conversoes.brl_para_eur && <p>Cálculo EUR: {conversoes.brl_para_eur}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

