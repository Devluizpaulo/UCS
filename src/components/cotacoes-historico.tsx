'use client';

import { useState, useEffect } from 'react';
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
import { getCotacoesHistorico, organizeCotacoesHistorico } from '@/lib/data-service';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CotacaoHistorica {
  id: string;
  ativo: string;
  data: string;
  abertura: number;
  maxima: number;
  minima: number;
  ultimo: number;
  volume?: number;
  variacao_pct?: number;
  fonte: string;
  moeda: string;
  timestamp: any;
}

interface CotacoesHistoricoProps {
  ativos: string[];
}

export function CotacoesHistorico({ ativos }: CotacoesHistoricoProps) {
  const [selectedAtivo, setSelectedAtivo] = useState<string>('');
  const [historico, setHistorico] = useState<CotacaoHistorica[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (ativos.length > 0 && !selectedAtivo) {
      setSelectedAtivo(ativos[0]);
    }
  }, [ativos, selectedAtivo]);

  const loadHistorico = async (ativo: string) => {
    setLoading(true);
    try {
      const data = await getCotacoesHistorico(ativo, 50);
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
  };

  useEffect(() => {
    if (selectedAtivo) {
      loadHistorico(selectedAtivo);
    }
  }, [selectedAtivo]);

  const handleOrganizeData = async () => {
    setOrganizing(true);
    try {
      const result = await organizeCotacoesHistorico();
      if (result.success) {
        toast({
            title: "Operação Concluída",
            description: result.message,
        });
        if (selectedAtivo) {
            await loadHistorico(selectedAtivo);
        }
      } else {
         toast({
            variant: "destructive",
            title: "Erro na Organização",
            description: result.message,
        });
      }
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
      // Assuming the ID is in 'YYYY-MM-DD' format after the organization step
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      // Fallback for old format
      const [day, month, year] = dateStr.split('/');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const renderTableRows = () => {
    if (loading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
          <TableCell colSpan={6} className="h-24 text-center">
            Nenhum histórico encontrado para este ativo.
          </TableCell>
        </TableRow>
      );
    }

    return historico.map((cotacao) => {
      const variacao = cotacao.variacao_pct || 0;
      const isPositive = variacao >= 0;

      return (
        <TableRow key={cotacao.id}>
          <TableCell className="font-medium">
            {formatDate(cotacao.id)}
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
            <div className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
              isPositive ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
            )}>
              {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {variacao.toFixed(2)}%
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Cotações</CardTitle>
            <CardDescription>
              Histórico organizado por ativo das cotações capturadas pelo n8n.
            </CardDescription>
          </div>
          <Button
            onClick={handleOrganizeData}
            disabled={organizing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", organizing && "animate-spin")} />
            {organizing ? 'Organizando...' : 'Organizar Dados'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="ativo-select" className="text-sm font-medium">
              Selecionar Ativo:
            </label>
            <Select value={selectedAtivo} onValueChange={setSelectedAtivo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Escolha um ativo" />
              </SelectTrigger>
              <SelectContent>
                {ativos.map((ativo) => (
                  <SelectItem key={ativo} value={ativo}>
                    {ativo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
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
