
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { getAssetCompositionConfig } from '@/lib/calculation-service';

const ITEMS_PER_PAGE = 7;

interface CalculatedAssetDetailsProps {
    asset: CommodityPriceData;
}


export function CalculatedAssetDetails({ asset }: CalculatedAssetDetailsProps) {
  const [compositionHistory, setCompositionHistory] = useState<FirestoreQuote[]>([]);
  const [commoditiesConfig, setCommoditiesConfig] = useState<Record<string, CommodityPriceData>>({});
  const [componentIds, setComponentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [history, configs, composition] = await Promise.all([
                getCotacoesHistorico(asset.id, 90),
                getCommodityConfigs(),
                getAssetCompositionConfig(asset.id)
            ]);
            
            const configMap = configs.reduce((acc, config) => {
                acc[config.id] = config as CommodityPriceData;
                return acc;
            }, {} as Record<string, CommodityPriceData>);
            
            setCompositionHistory(history);
            setCommoditiesConfig(configMap);
            setComponentIds(composition);

        } catch (error) {
            console.error("Failed to fetch calculated asset details:", error);
            setCompositionHistory([]);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [asset.id]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return compositionHistory.slice(startIndex, endIndex);
  }, [compositionHistory, currentPage]);
  
  const totalPages = Math.ceil(compositionHistory.length / ITEMS_PER_PAGE);

  if (isLoading || componentIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição do Cálculo</CardTitle>
           <CardDescription>Carregando histórico de composição...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 h-48">
             {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             ) : (
                <p className="text-sm text-muted-foreground">Não há configuração de composição para este ativo.</p>
             )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição do Cálculo de {asset.name}</CardTitle>
        <CardDescription>Histórico de componentes dos últimos 90 dias.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {componentIds.map(id => (
                  <TableHead key={id} className="text-right">
                    {commoditiesConfig[id]?.name || id}
                  </TableHead>
              ))}
              <TableHead className="text-right font-bold">Total ({asset.name})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? paginatedData.map((item) => (
              <TableRow key={item.timestamp}>
                <TableCell>{item.data}</TableCell>
                {componentIds.map(id => {
                  const componentAsset = commoditiesConfig[id];
                  const value = item.componentes?.[id] ?? 0;
                  return (
                    <TableCell key={id} className="text-right font-mono">
                      {value > 0 ? formatCurrency(value, componentAsset?.currency || 'BRL', id) : 'N/A'}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(item.valor ?? item.ultimo, asset.currency, asset.id)}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={componentIds.length + 2} className="h-24 text-center text-muted-foreground">
                  Nenhum dado de composição encontrado para este período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
