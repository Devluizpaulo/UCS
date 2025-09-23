
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCotacoesHistorico } from '@/lib/data-service';
import { COMMODITIES_CONFIG } from '@/lib/commodity-config-service';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { isCalculableAsset, CALCULATION_CONFIGS } from '@/lib/calculation-service';

const ITEMS_PER_PAGE = 7;

interface CalculatedAssetDetailsProps {
    asset: CommodityPriceData;
}

export function CalculatedAssetDetails({ asset }: CalculatedAssetDetailsProps) {
  const [compositionHistory, setCompositionHistory] = useState<FirestoreQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const assetConfig = useMemo(() => {
    if (!isCalculableAsset(asset.id)) return null;
    return CALCULATION_CONFIGS[asset.id];
  }, [asset.id]);

  useEffect(() => {
    setIsLoading(true);
    getCotacoesHistorico(asset.id)
      .then((data) => {
        setCompositionHistory(data);
        setIsLoading(false);
      })
      .catch(() => {
        setCompositionHistory([]);
        setIsLoading(false);
      });
  }, [asset.id]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return compositionHistory.slice(startIndex, endIndex);
  }, [compositionHistory, currentPage]);
  
  const totalPages = Math.ceil(compositionHistory.length / ITEMS_PER_PAGE);

  if (isLoading || !assetConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição do Cálculo</CardTitle>
           <CardDescription>Carregando histórico de composição...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 p-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const componentIds = assetConfig.components;

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
                    {COMMODITIES_CONFIG[id]?.name || id}
                  </TableHead>
              ))}
              <TableHead className="text-right font-bold">Total ({asset.name})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.timestamp}>
                <TableCell>{item.data}</TableCell>
                {componentIds.map(id => {
                  const componentAsset = COMMODITIES_CONFIG[id];
                  return (
                    <TableCell key={id} className="text-right font-mono">
                      {formatCurrency(item[id] ?? 0, componentAsset?.currency || 'BRL')}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(item.ultimo, asset.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      </CardContent>
    </Card>
  );
}
