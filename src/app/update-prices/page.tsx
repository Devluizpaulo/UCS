
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { getCommodities } from '@/lib/commodity-config-service';
import { getMarketDataHistory } from '@/lib/data-provider-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { saveConfirmedPrices, type StagedPrice } from './actions';


// Client-side action to get prices for review
async function getStagedPrices(): Promise<StagedPrice[]> {
    const apiKey = process.env.NEXT_PUBLIC_MARKETDATA_API_KEY;
    if (!apiKey) {
        throw new Error("A chave da API MarketData não está configurada.");
    }

    const commodities = await getCommodities();
    const stagedPricesPromises = commodities.map(async (commodity) => {
        try {
            const history = await getMarketDataHistory(apiKey, commodity.ticker, 'D', 2);
            if (history.s !== 'ok' || !history.c || history.c.length === 0) {
                throw new Error(`No data for ${commodity.ticker}`);
            }
            const price = history.c[history.c.length - 1];
            const timestamp = history.t[history.t.length - 1];
            return {
                ...commodity,
                price: price,
                lastUpdated: new Date(timestamp * 1000).toLocaleDateString('pt-BR'),
            };
        } catch (error) {
            console.error(`Failed to fetch price for ${commodity.name}:`, error);
            return {
                ...commodity,
                price: 0,
                lastUpdated: 'Falha ao buscar',
            };
        }
    });

    return Promise.all(stagedPricesPromises);
}

export default function UpdatePricesPage() {
    const [stagedPrices, setStagedPrices] = useState<StagedPrice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const fetchPricesForReview = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const prices = await getStagedPrices();
            setStagedPrices(prices);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ocorreu um erro desconhecido ao buscar os preços.");
            toast({
                variant: 'destructive',
                title: 'Erro ao Buscar Preços',
                description: err.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        toast({
            title: 'Buscando Cotações...',
            description: 'Aguarde enquanto buscamos os preços de fechamento mais recentes para sua revisão.',
        });
        fetchPricesForReview();
    }, [fetchPricesForReview, toast]);

    const handleConfirmAndSave = async () => {
        setIsSaving(true);
        toast({
            title: 'Salvando Preços e Recalculando Índice',
            description: 'Este processo pode levar alguns instantes. Por favor, aguarde.',
        });
        try {
            const result = await saveConfirmedPrices(stagedPrices);
            if (result.success) {
                toast({
                    title: 'Sucesso!',
                    description: result.message,
                });
                router.push('/');
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: err.message,
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return [...Array(7)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-32 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (error) {
            return (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                        <div className="text-destructive flex items-center justify-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        return stagedPrices.map((asset) => (
            <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell className="text-right font-mono">{asset.currency} {asset.price.toFixed(4)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{asset.lastUpdated}</TableCell>
            </TableRow>
        ));
    };

    return (
        <MainLayout>
            <PageHeader title="Revisão de Preços" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
                <div className="mx-auto w-full max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revisar e Confirmar Cotações</CardTitle>
                            <CardDescription>
                                Verifique os preços de fechamento mais recentes antes de salvá-los. Esta ação irá recalcular o valor do Índice UCS para o dia de hoje.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ativo</TableHead>
                                            <TableHead className="text-right">Preço de Fechamento</TableHead>
                                            <TableHead className="text-right">Data da Cotação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {renderContent()}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => router.push('/')} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmAndSave} disabled={isLoading || isSaving || !!error}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Confirmar e Salvar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </MainLayout>
    );
}
