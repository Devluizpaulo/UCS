'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { getCotacoesDoDia, organizeCotacoesHistorico } from '@/lib/data-service';
import type { FirestoreQuote } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface CotacoesHistoricoProps {
  ativos: string[];
}

export function CotacoesHistorico({ ativos }: CotacoesHistoricoProps) {
  const [selectedAtivo, setSelectedAtivo] = useState<string>('todos');
  const [historico, setHistorico] = useState<FirestoreQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const { toast } = useToast();

  const loadHistorico = useCallback(async (ativo: string) => {
    setLoading(true);
    try {
      // Always query the "staging" collection 'cotacoes_do_dia'
      const data = await getCotacoesDoDia(ativo === 'todos' ? undefined : ativo, 50);
      setHistorico(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Histórico",
        description: "Não foi possível buscar os dados do histórico para este ativo.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Initial load when component mounts or selectedAtivo changes
    loadHistorico(selectedAtivo);
  }, [selectedAtivo, loadHistorico]);


  const handleOrganizeData = async () => {
    setOrganizing(true);
    try {
      const result = await organizeCotacoesHistorico();
      toast({
          title: result.success ? "Operação Concluída" : "Erro na Organização",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });
      // Refresh the data after organizing to show the updated (likely empty) list
      await loadHistorico(selectedAtivo);
    } catch (error: any) {
      console.error('Erro ao organizar dados:', error);
       toast({
            variant: "destructive",
            title: "Erro Inesperado",
            description: error.message || "Ocorreu uma falha ao tentar organizar os dados.",
        });
    } finally {
      setOrganizing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Handle 'YYYY-MM-DD' from organized data or 'DD/MM/YYYY' from raw data
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      return dateStr; // Assume it's already DD/MM/YYYY
    } catch {
      return dateStr;
    }
  };

  const renderTableRows = () => {
    if (loading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ));
    }

    if (historico.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            Nenhuma cotação aguardando organização.
          </TableCell>
        </TableRow>
      );
    }

    return historico.map((cotacao) => {
      // The 'variacao_pct' can be null, so we default to 0
      const variacao = cotacao.variacao_pct ?? 0;
      const isPositive = variacao >= 0;
      const hasVariacao = cotacao.variacao_pct !== null && cotacao.variacao_pct !== undefined;

      return (
        <TableRow key={cotacao.id}>
          <TableCell className="font-medium">
            {formatDate(cotacao.data)}
          </TableCell>
          <TableCell className="font-medium truncate max-w-xs">
            {cotacao.ativo}
          </TableCell>
          <TableCell className="text-right font-mono">
            <AnimatedNumber value={cotacao.abertura} currency={cotacao.moeda as 'BRL' | 'USD' | 'EUR'} />
          </TableCell>
          <TableCell className="text-right font-mono">
            <AnimatedNumber value={cotacao.maxima} currency={cotacao.moeda as 'BRL' | 'USD' | 'EUR'} />
          </TableCell>
          <TableCell className="text-right font-mono">
            <AnimatedNumber value={cotacao.minima} currency={cotacao.moeda as 'BRL' | 'USD' | 'EUR'} />
          </TableCell>
          <TableCell className="text-right font-mono">
            <AnimatedNumber value={cotacao.ultimo} currency={cotacao.moeda as 'BRL' | 'USD' | 'EUR'} />
          </TableCell>
          <TableCell className="text-right">
            {hasVariacao ? (
              <div className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                isPositive ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
              )}>
                {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {variacao.toFixed(2)}%
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Cotações Recebidas (Fonte n8n)</CardTitle>
            <CardDescription>
              Dados brutos da coleção <code className="font-mono text-xs bg-muted p-1 rounded-sm">cotacoes_do_dia</code> aguardando organização.
            </CardDescription>
          </div>
          <Button
            onClick={handleOrganizeData}
            disabled={organizing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", organizing && "animate-spin")} />
            {organizing ? 'Organizando...' : 'Organizar e Arquivar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="ativo-select" className="text-sm font-medium shrink-0">
              Filtrar Ativo:
            </label>
            <Select value={selectedAtivo} onValueChange={setSelectedAtivo}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Escolha um ativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  Todos os Ativos
                </SelectItem>
                {ativos.map((ativo) => (
                  <SelectItem key={ativo} value={ativo}>
                    {ativo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Abertura</TableHead>
                  <TableHead className="text-right">Máxima</TableHead>
                  <TableHead className="text-right">Mínima</TableHead>
                  <TableHead className="text-right">Fechamento</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
