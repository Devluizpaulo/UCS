

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
import { format, parseISO, isValid, parse } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface HistoricalPriceTableProps {
  assetId: string;
  data: FirestoreQuote[];
  assetConfig: CommodityPriceData | undefined;
  isLoading: boolean;
  onRowClick: (quote: FirestoreQuote) => void;
}

const ITEMS_PER_PAGE = 10;

// Função para extrair preço de uma cotação
const getPriceFromQuote = (quote: FirestoreQuote, assetId: string): number | undefined => {
  if (!quote) return undefined;
  
  // Prioriza o valor já convertido para BRL se existir
  if (quote.ultimo_brl) return quote.ultimo_brl;
  
  if (assetId === 'ucs_ase') {
    const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
    return typeof value === 'number' ? value : undefined;
  }
  
  const value = quote.valor ?? quote.ultimo;
  return typeof value === 'number' ? value : undefined;
};

export function AssetHistoricalTable({ assetId, data, assetConfig, isLoading, onRowClick }: HistoricalPriceTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
        let dateA, dateB;
        try {
            if (typeof a.data === 'string' && a.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                dateA = parse(a.data, 'dd/MM/yyyy', new Date());
            } else if (a.timestamp) {
                dateA = new Date(a.timestamp as any);
            } else {
                return 1;
            }
        } catch {
            return 1;
        }

        try {
            if (typeof b.data === 'string' && b.data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                dateB = parse(b.data, 'dd/MM/yyyy', new Date());
            } else if (b.timestamp) {
                dateB = new Date(b.timestamp as any);
            } else {
                return -1;
            }
        } catch {
            return -1;
        }

        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        
        return dateB.getTime() - dateA.getTime();
    });
  }, [data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage]);
  
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const formatDate = (quote: FirestoreQuote) => {
    try {
      if (quote.data && typeof quote.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(quote.data)) {
        return quote.data;
      }
      
      const date = new Date(quote.timestamp as any);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (quote: FirestoreQuote) => {
    try {
      const date = new Date(quote.timestamp as any);
      return isValid(date) ? format(date, 'HH:mm:ss') : '';
    } catch {
      return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!paginatedData || paginatedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum dado histórico disponível para este período.</p>
      </div>
    );
  }
  
  const isForexAsset = assetId === 'soja' || assetId === 'carbono' || assetId === 'madeira';

  return (
    <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                {isForexAsset && <TableHead className="text-right">Preço Original</TableHead>}
                <TableHead className="text-right">Preço (BRL)</TableHead>
                <TableHead className="text-right">Variação %</TableHead>
                <TableHead className="text-right">Variação Abs.</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((quote, index) => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const priceBRL = getPriceFromQuote(quote, assetId);
                const originalPrice = quote.ultimo;
                const variation = quote.variacao_pct ?? 0;
                
                const previousQuote = index < sortedData.length - 1 ? sortedData[startIndex + index + 1] : null;
                const previousPriceBRL = previousQuote ? getPriceFromQuote(previousQuote, assetId) : undefined;
                
                const absoluteChange = (priceBRL !== undefined && previousPriceBRL !== undefined) 
                    ? priceBRL - previousPriceBRL 
                    : quote.variacao_abs ?? 0;

                const uniqueKey = `${quote.id || 'no-id'}-${quote.timestamp || 'no-timestamp'}-${startIndex + index}`;

                return (
                  <TableRow 
                    key={uniqueKey} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onRowClick(quote)}
                  >
                    <TableCell className="font-medium">
                      {formatDate(quote)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTime(quote)}
                    </TableCell>
                     {isForexAsset && (
                        <TableCell className="text-right font-mono text-muted-foreground">
                            {originalPrice ? formatCurrency(originalPrice, assetConfig?.currency || 'BRL', assetId) : 'N/A'}
                        </TableCell>
                    )}
                    <TableCell className="font-mono text-right">
                      {priceBRL !== undefined ? formatCurrency(priceBRL, 'BRL', assetId) : 'N/A'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      variation >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {variation !== null && variation !== undefined ? 
                        `${variation >= 0 ? '+' : ''}${variation.toFixed(2)}%` : 'N/A'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      absoluteChange >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {absoluteChange !== null && absoluteChange !== undefined ? 
                        `${absoluteChange >= 0 ? '+' : ''}${formatCurrency(absoluteChange, 'BRL', assetId)}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(quote);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} • {sortedData.length} registros no total
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
  );
}
