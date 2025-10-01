'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  CheckCheck,
  ExternalLink,
  History,
  Calculator,
  Edit,
  Loader2,
} from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid, format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { getCommodityConfigs, getQuoteByDate } from '@/lib/data-service';
import type { CommodityConfig, FirestoreQuote } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

type AssetItem = CommodityConfig & {
  quote: FirestoreQuote | null;
  status: 'ATIVO' | 'ERRO';
  type: 'COTADO' | 'CALCULADO';
};

const CALCULATED_CATEGORIES: CommodityConfig['category'][] = [
  'index',
  'sub-index',
  'vus',
  'vmad',
  'crs',
];

export default function StatusPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();

  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [assetItems, setAssetItems] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialDate = getValidatedDate(dateParam) || new Date();
    setTargetDate(initialDate);
  }, [dateParam]);

  useEffect(() => {
    if (!targetDate) return;

    setIsLoading(true);
    const fetchData = async () => {
      try {
        const configs = await getCommodityConfigs();
        const items = await Promise.all(
          configs.map(async (config) => {
            const quote = await getQuoteByDate(config.id, targetDate);
            return {
              ...config,
              quote,
              status: quote ? ('ATIVO' as const) : ('ERRO' as const),
              type: CALCULATED_CATEGORIES.includes(config.category)
                ? ('CALCULADO' as const)
                : ('COTADO' as const),
            };
          })
        );
        // Ordena para que os cotados venham primeiro
        items.sort((a, b) => (a.type === 'COTADO' ? -1 : 1));
        setAssetItems(items);
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar dados',
          description: err.message,
        });
        setAssetItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [targetDate, toast]);
  
  if (!targetDate) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const formattedDate = format(targetDate, 'dd/MM/yyyy');

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader
          title="Painel de Status"
          description={`Status da ingestão e cálculo de dados para ${formattedDate}`}
          icon={CheckCheck}
        >
          <DateNavigator targetDate={targetDate} />
        </PageHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Ativos</CardTitle>
              <CardDescription>
                Verifique se todos os ativos foram cotados e calculados corretamente para a data selecionada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Principal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-20 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                         <TableCell className="text-center">
                           <div className="flex justify-center gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : assetItems.length > 0 ? (
                    assetItems.map((asset) => {
                      const Icon = getIconForCategory(asset);
                      const principalValue = asset.quote?.ultimo ?? asset.quote?.valor ?? 'N/A';
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="font-medium">{asset.name}</div>
                            </div>
                          </TableCell>
                           <TableCell>
                            <Badge variant={asset.type === 'COTADO' ? 'default' : 'secondary'} className={cn(
                                asset.type === 'CALCULADO' && 'bg-orange-500 text-white hover:bg-orange-600'
                            )}>
                              {asset.type}
                            </Badge>
                          </TableCell>
                           <TableCell className="text-right font-mono">
                            {typeof principalValue === 'number'
                              ? formatCurrency(principalValue, asset.currency, asset.id)
                              : principalValue}
                          </TableCell>
                           <TableCell>
                             <Badge variant={asset.status === 'ATIVO' ? 'outline' : 'destructive'} className={cn(
                                asset.status === 'ATIVO' && 'border-green-500 text-green-600'
                             )}>
                              {asset.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {asset.type === 'COTADO' ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" asChild>
                                            <a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Ver no site</p></TooltipContent>
                                </Tooltip>
                              ) : (
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Calculator className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                     <TooltipContent><p>Ver fórmula</p></TooltipContent>
                                </Tooltip>
                              )}
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                     <TooltipContent><p>Editar no DB</p></TooltipContent>
                                </Tooltip>
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <History className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Ver histórico</p></TooltipContent>
                                </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum ativo configurado. Adicione ativos na página de Gerenciamento de Ativos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}
