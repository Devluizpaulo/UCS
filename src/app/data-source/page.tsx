
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
import { getCotacoesDoDia } from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// This is now a Server Component
export const dynamic = 'force-dynamic'; // Ensures the data is fetched on every request

type LoadQuotesResult = {
    quotes: FirestoreQuote[];
    error?: string;
};

async function loadQuotes(): Promise<LoadQuotesResult> {
  try {
    const data = await getCotacoesDoDia(undefined, 200);
    return { quotes: data };
  } catch (error: any) {
    console.error('Erro ao carregar cotações do dia:', error);
    // Pass a specific error message for auth failures
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


export default async function DataSourcePage() {
  const { quotes, error } = await loadQuotes();

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
              {error ? (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Dados do Servidor</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle>Visualização Direta do Servidor</AlertTitle>
                  <AlertDescription>
                    Os dados abaixo são uma leitura direta do Firestore feita pelo servidor. Se a tabela estiver vazia, significa que não há documentos na coleção `cotacoes_do_dia`.
                  </AlertDescription>
                </Alert>
              )}
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
                    {quotes.length === 0 && !error ? (
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
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
    </MainLayout>
  );
}
