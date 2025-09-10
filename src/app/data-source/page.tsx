
'use client';

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
import type { FirestoreQuote } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// This is now a Client Component to allow for manual refresh
async function loadQuotes(): Promise<{ quotes: FirestoreQuote[]; error?: string; }> {
  try {
    const response = await fetch('/api/raw-quotes');
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch raw quotes');
    }
    const data = await response.json();
    return { quotes: data };
  } catch (error: any) {
    console.error('Erro ao carregar cotações do dia:', error);
    if (error.message && error.message.includes('Could not refresh access token')) {
        return { 
            quotes: [], 
            error: 'Falha na autenticação com o Firebase. Verifique se suas Credenciais Padrão da Aplicação (ADC) estão configuradas corretamente no ambiente do servidor. Execute `gcloud auth application-default login` em seu terminal.' 
        };
    }
    return { quotes: [], error: 'Ocorreu um erro desconhecido ao buscar os dados do Firestore.' };
  }
}

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    // It's a server component, so we will get a Firestore Timestamp
    if (date.toDate) { 
      return date.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    }
    // Fallback for other date types
    return new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};


export default function DataSourcePage() {
  const [quotes, setQuotes] = useState<FirestoreQuote[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { quotes: fetchedQuotes, error: fetchError } = await loadQuotes();
    setQuotes(fetchedQuotes);
    setError(fetchError);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (loading) {
      return (
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
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    if (error) {
       return (
           <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Dados do Servidor</AlertTitle>
              <AlertDescription>
                  {error}
              </AlertDescription>
          </Alert>
       )
    }

    return (
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
          {quotes.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                      Nenhuma cotação encontrada na coleção `cotacoes_do_dia`.
                  </TableCell>
              </TableRow>
          ) : (
              quotes.map((quote: FirestoreQuote) => (
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
              ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Fonte de Dados Brutos" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Conteúdo da Coleção: `cotacoes_do_dia`</CardTitle>
                <CardDescription>
                  Esta página exibe os dados brutos recebidos pelo n8n para fins de diagnóstico e validação.
                </CardDescription>
              </div>
               <Button onClick={fetchData} disabled={loading} size="sm">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {!error && !loading && (
                <Alert className="mb-4">
                  <Database className="h-4 w-4" />
                  <AlertTitle>Leitura Direta do Servidor</AlertTitle>
                  <AlertDescription>
                    Os dados abaixo são uma leitura direta do Firestore feita pelo servidor. Se a tabela estiver vazia, significa que não há documentos na coleção `cotacoes_do_dia`.
                  </AlertDescription>
                </Alert>
              )}
              <ScrollArea className="h-[60vh] w-full border rounded-md">
                {renderContent()}
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
    </MainLayout>
  );
}
