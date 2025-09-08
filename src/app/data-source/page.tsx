
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getCotacoesDoDia } from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DataSourcePage() {
  const [quotes, setQuotes] = useState<FirestoreQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large number of quotes to see everything in the collection
      const data = await getCotacoesDoDia(undefined, 200);
      setQuotes(data);
    } catch (error) {
      console.error('Erro ao carregar cotações do dia:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Cotações",
        description: "Não foi possível buscar os dados da coleção cotacoes_do_dia.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) { // Check if it's a Firestore Timestamp
      return date.toDate().toLocaleString('pt-BR');
    }
    return new Date(date).toLocaleString('pt-BR');
  };

  const renderTableRows = () => {
    if (loading) {
      return Array.from({ length: 15 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ));
    }

    if (quotes.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            Nenhuma cotação encontrada na coleção `cotacoes_do_dia`.
          </TableCell>
        </TableRow>
      );
    }

    return quotes.map((quote) => (
      <TableRow key={quote.id}>
        <TableCell className="font-medium text-xs">
          {formatDate(quote.timestamp)}
        </TableCell>
        <TableCell className="font-medium">
          {quote.ativo}
        </TableCell>
        <TableCell className="font-mono text-sm">
          {quote.ultimo?.toFixed(4) ?? 'N/A'}
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {quote.id}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Fonte de Dados Brutos" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Coleção: `cotacoes_do_dia`</CardTitle>
              <CardDescription>
                Esta página exibe os dados brutos exatamente como são recebidos pelo n8n. Use-a para verificar se os dados estão chegando corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Visualização Direta</AlertTitle>
                <AlertDescription>
                  Os dados abaixo são uma leitura direta do Firestore. Se a tabela estiver vazia, significa que o n8n não salvou nenhum dado na coleção `cotacoes_do_dia`.
                </AlertDescription>
              </Alert>
              <ScrollArea className="h-[60vh] mt-4 w-full border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Último Preço</TableHead>
                      <TableHead>ID do Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderTableRows()}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
    </MainLayout>
  );
}
