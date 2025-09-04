'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { saveConfirmedPrices } from './actions';
import { fetchPricesForReview } from '@/ai/flows/update-prices-flow';
import { useRouter } from 'next/navigation';

type StagedPrice = {
  id: string;
  name: string;
  ticker: string;
  currency: 'BRL' | 'USD' | 'EUR';
  price: number;
};

export default function UpdatePricesPage() {
  const [stagedPrices, setStagedPrices] = useState<StagedPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function fetchPrices() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchPricesForReview();
        if (result.success) {
          setStagedPrices(result.prices as StagedPrice[]);
        } else {
          throw new Error(result.message);
        }
      } catch (err: any) {
        setError("Não foi possível buscar as cotações. Verifique a conexão com a API e tente novamente.");
        console.error("Fetch prices error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrices();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    toast({ title: "Salvando Dados...", description: "Os novos preços estão sendo salvos e o índice recalculado." });
    try {
        const result = await saveConfirmedPrices(stagedPrices);
        if (result.success) {
            toast({
                title: "Sucesso!",
                description: `Dados salvos. Novo valor do índice: ${result.newIndexValue?.toFixed(4)}`,
            });
            // Redirect to dashboard to see the new value
            router.push('/');
        } else {
            throw new Error(result.message);
        }
    } catch (err: any) {
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: err.message || "Não foi possível salvar os dados.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border-b">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/3" />
                </div>
            ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 px-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold">Falha ao Buscar Preços</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      );
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Preço de Fechamento (API)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {stagedPrices.map(price => (
                    <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.name}</TableCell>
                        <TableCell className="font-mono text-xs">{price.ticker}</TableCell>
                        <TableCell className="text-right font-mono">{price.price > 0 ? price.price.toFixed(4) : "Falha na busca"}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
  };


  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Revisão e Atualização de Preços" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Cotações do Dia</CardTitle>
                <CardDescription>
                  Revise os preços de fechamento mais recentes obtidos do Yahoo Finance. Após a confirmação, os dados serão salvos e o Índice UCS será recalculado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                   {renderContent()}
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 flex justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading || isSaving || !!error || stagedPrices.length === 0}
                    size="lg"
                >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Confirmar e Salvar Preços
                </Button>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
