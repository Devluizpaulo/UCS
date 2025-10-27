
"use client";

import { useState, useEffect } from 'react';
import { getQuoteByDate } from '@/lib/data-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Loader2, DollarSign, Euro, Bot, CheckCircle, AlertTriangle, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface UcsAseDetailsProps {
    asset: CommodityPriceData;
}

const DetailRow = ({ label, value, className, isFinal = false }: { label: string; value: React.ReactNode; className?: string; isFinal?: boolean }) => (
    <div className={`flex justify-between items-center py-3 border-b ${className}`}>
        <span className={`text-sm ${isFinal ? 'font-semibold text-primary-foreground' : 'text-muted-foreground'}`}>{label}</span>
        <span className={`text-sm font-semibold font-mono text-right ${isFinal ? 'text-primary-foreground' : ''}`}>{value}</span>
    </div>
);

// Bloco destacado para o Resultado Final com melhor legibilidade
const FinalResultRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="mt-2 rounded-xl bg-emerald-600 text-emerald-50 shadow-sm ring-1 ring-emerald-700/40">
        <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-medium opacity-95">
                {label}
            </div>
            <div className="font-mono font-bold text-2xl md:text-3xl tracking-tight">
                {value}
            </div>
        </div>
    </div>
);

export function UcsAseDetails({ asset }: UcsAseDetailsProps) {
    const [latestQuote, setLatestQuote] = useState<FirestoreQuote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nextBusinessDay, setNextBusinessDay] = useState<Date | null>(null);

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

    // Quando indisponível, busca próximo dia útil sugerido pela API central
    useEffect(() => {
        const fetchSuggested = async () => {
            if (!asset?.isBlocked) return;
            try {
                const res = await fetch('/api/business-day-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: new Date().toISOString() })
                });
                const json = await res.json();
                if (json?.suggestedDate) {
                    setNextBusinessDay(new Date(json.suggestedDate));
                }
            } catch {}
        };
        fetchSuggested();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asset?.isBlocked]);

    const navigateToDate = (date: Date) => {
        const iso = format(date, 'yyyy-MM-dd');
        const params = new URLSearchParams(window.location.search);
        params.set('date', iso);
        window.location.search = params.toString();
    };

    const goToPreviousBusinessDay = async () => {
        try {
            const res = await fetch(`/api/business-day/previous?date=${format(new Date(), 'yyyy-MM-dd')}`);
            const json = await res.json();
            if (json?.success && json?.date) {
                navigateToDate(new Date(json.date));
            }
        } catch {}
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }
    
    if (!latestQuote) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
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
            {/* Banner de indisponibilidade com ações rápidas */}
            {asset.isBlocked && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Indisponível hoje{asset.blockReason ? `: ${asset.blockReason}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousBusinessDay}>
                            <ArrowLeftCircle className="h-4 w-4 mr-1" /> Último dia útil
                        </Button>
                        {nextBusinessDay && (
                          <Button variant="outline" size="sm" onClick={() => navigateToDate(nextBusinessDay)}>
                            <ArrowRightCircle className="h-4 w-4 mr-1" /> Ir para {format(nextBusinessDay, 'dd/MM')}
                          </Button>
                        )}
                    </div>
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Composição do Valor Final
                    </CardTitle>
                    <CardDescription>Valores calculados para o dia {latestQuote.data}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <DetailRow 
                        label="UCS Original (BRL)" 
                        value={formatCurrency(valoresOriginais.ucs || 0, 'BRL', 'ucs')}
                    />
                    <DetailRow 
                        label="Fórmula Aplicada"
                        value={latestQuote.formula || 'UCS × 2'}
                    />
                     <FinalResultRow 
                        label="Resultado Final (BRL)" 
                        value={formatCurrency(componentes.resultado_final_brl || asset.price, 'BRL', 'ucs_ase')}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Conversão para Outras Moedas
                    </CardTitle>
                    <CardDescription>Cotações utilizadas no cálculo de hoje.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-2">
                        <p className="font-semibold text-sm flex items-center gap-2 text-foreground"><DollarSign className="w-4 h-4"/> Dólar (USD)</p>
                        <DetailRow label="Cotação (USD/BRL)" value={formatCurrency(valoresOriginais.cotacao_usd || 0, 'BRL', 'usd')} />
                        <DetailRow 
                            label="Valor Final (USD)" 
                            value={formatCurrency(componentes.resultado_final_usd || 0, 'USD', 'ucs_ase')}
                        />
                        {conversoes.brl_para_usd && <p className="text-xs text-muted-foreground pt-1">Cálculo: {conversoes.brl_para_usd}</p>}
                    </div>
                    <div className="space-y-2">
                         <p className="font-semibold text-sm flex items-center gap-2 text-foreground"><Euro className="w-4 h-4"/> Euro (EUR)</p>
                         <DetailRow label="Cotação (EUR/BRL)" value={formatCurrency(valoresOriginais.cotacao_eur || 0, 'BRL', 'eur')} />
                         <DetailRow 
                            label="Valor Final (EUR)" 
                            value={formatCurrency(componentes.resultado_final_eur || 0, 'EUR', 'ucs_ase')}
                         />
                         {conversoes.brl_para_eur && <p className="text-xs text-muted-foreground pt-1">Cálculo: {conversoes.brl_para_eur}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
