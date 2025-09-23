
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCh2oCompositionHistory } from '@/lib/data-service';
import type { Ch2oCompositionData } from '@/lib/types';
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
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/formatters';

const ITEMS_PER_PAGE = 7;

export function Ch2oDetails() {
  const [compositionHistory, setCompositionHistory] = useState<Ch2oCompositionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    getCh2oCompositionHistory()
      .then((data) => {
        setCompositionHistory(data);
        setIsLoading(false);
      })
      .catch(() => {
        setCompositionHistory([]);
        setIsLoading(false);
      });
  }, []);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return compositionHistory.slice(startIndex, endIndex);
  }, [compositionHistory, currentPage]);
  
  const totalPages = Math.ceil(compositionHistory.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição do Cálculo (Últimos 90 dias)</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição do Cálculo (Últimos 90 dias)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Boi Gordo</TableHead>
              <TableHead className="text-right">Milho</TableHead>
              <TableHead className="text-right">Soja</TableHead>
              <TableHead className="text-right">Madeira</TableHead>
              <TableHead className="text-right">Carbono</TableHead>
              <TableHead className="text-right font-bold">Total (CH²O)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.timestamp}>
                <TableCell>{item.date}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(item.components.boi_gordo, 'BRL')}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(item.components.milho, 'BRL')}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(item.components.soja, 'BRL')}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(item.components.madeira, 'BRL')}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(item.components.carbono, 'BRL')}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(item.total, 'BRL')}</TableCell>
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
