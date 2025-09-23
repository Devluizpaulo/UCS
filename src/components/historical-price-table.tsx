
'use client';

import { useState, useMemo } from 'react';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
}

const ITEMS_PER_PAGE = 7;

export function HistoricalPriceTable({ asset, historicalData, isLoading }: HistoricalPriceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return historicalData.slice(startIndex, endIndex);
  }, [historicalData, currentPage]);
  
  const totalPages = Math.ceil(historicalData.length / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Históricos (Últimos 90 dias)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
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
                  <TableRow key={quote.id}>
                    <TableCell>{format(new Date(quote.timestamp), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(quote.ultimo, asset.currency, asset.id)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      (Number(quote.variacao_pct) ?? 0) >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {quote.variacao_pct !== null ? `${Number(quote.variacao_pct).toFixed(2)}%` : 'N/A'}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
