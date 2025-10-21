
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
import { ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface HistoricalPriceTableProps {
  asset: CommodityPriceData;
  historicalData: FirestoreQuote[];
  isLoading: boolean;
  onRowClick: (quote: FirestoreQuote) => void;
}

const ITEMS_PER_PAGE = 15;

// Função para extrair preço de uma cotação
const getPriceFromQuote = (quote: FirestoreQuote, assetId: string): number | undefined => {
  if (!quote) return undefined;
  
  if (assetId === 'ucs_ase') {
    // Para UCS ASE, usar valor_brl como principal, com fallbacks
    const value = quote.valor_brl ?? quote.resultado_final_brl ?? quote.valor_eur ?? quote.valor_usd;
    return typeof value === 'number' ? value : undefined;
  }
  
  const value = quote.valor ?? quote.ultimo;
  return typeof value === 'number' ? value : undefined;
};

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
  };

  const formatDate = (quote: FirestoreQuote) => {
    if (quote.data) {
      return quote.data;
    }
    if (quote.timestamp) {
      try {
        return format(new Date(quote.timestamp as any), 'dd/MM/yyyy');
      } catch {
        return 'Data inválida';
      }
    }
    return 'N/A';
  };

  const formatTime = (quote: FirestoreQuote) => {
    if (quote.timestamp) {
      try {
        return format(new Date(quote.timestamp as any), 'HH:mm:ss');
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Cotações - {asset.name}
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {historicalData.length} registros
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Variação %</TableHead>
                    <TableHead className="text-right">Variação Abs.</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((quote) => {
                    const price = getPriceFromQuote(quote, asset.id);
                    const variationPct = quote.variacao_pct ?? 0;
                    const variationAbs = quote.variacao_abs ?? 0;
                    
                    return (
                      <TableRow 
                        key={quote.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onRowClick(quote)}
                      >
                        <TableCell className="font-medium">
                          {formatDate(quote)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(quote)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {price !== undefined ? formatCurrency(price, asset.currency, asset.id) : 'N/A'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          variationPct >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {variationPct !== null && variationPct !== undefined ? 
                            `${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(2)}%` : 'N/A'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          variationAbs >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {variationAbs !== null && variationAbs !== undefined ? 
                            `${variationAbs >= 0 ? '+' : ''}${formatCurrency(variationAbs, asset.currency, asset.id)}` : 'N/A'}
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
                  Página {currentPage} de {totalPages} • {historicalData.length} registros total
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
      </CardContent>
    </Card>
  );
}
