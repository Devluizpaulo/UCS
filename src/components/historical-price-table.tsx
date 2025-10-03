
'use client';

import { useState, useMemo } from 'react';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoricalPriceTableProps {
  asset: CommodityPriceData;
  historicalData: FirestoreQuote[];
  isLoading: boolean;
  onRowClick: (assetId: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function HistoricalPriceTable({ asset, historicalData, isLoading, onRowClick }: HistoricalPriceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return historicalData.slice(startIndex, endIndex);
  }, [historicalData, currentPage]);
  
  const totalPages = Math.ceil(historicalData.length / ITEMS_PER_PAGE);

  const getCleanedQuote = (quote: FirestoreQuote) => {
    const cleaned: Record<string, any> = {};
    const excludeKeys = ['fonte', 'status', 'formula', 'id', 'ativo', 'moeda'];
    for (const key in quote) {
      if (!excludeKeys.includes(key)) {
        cleaned[key] = quote[key as keyof FirestoreQuote];
      }
    }
    return cleaned;
  }

  return (
    <div className="border rounded-lg">
      {isLoading ? (
        <div className="space-y-2 p-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((quote) => (
                <TableRow key={quote.id} onClick={() => onRowClick(asset.id)} className="cursor-pointer">
                  <TableCell>{quote.data || format(new Date(quote.timestamp), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(quote.valor ?? quote.ultimo, asset.currency, asset.id)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
                    (Number(quote.variacao_pct) ?? 0) >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {quote.variacao_pct !== null && quote.variacao_pct !== undefined ? `${Number(quote.variacao_pct).toFixed(2)}%` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
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
        </>
      )}
    </div>
  );
}
