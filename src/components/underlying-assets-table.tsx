

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ArrowDown, ArrowUp, DollarSign, Euro, Beef, Leaf, TreePine, Recycle, RefreshCw, Loader2, Wheat, LandPlot, Sun, Droplets } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Helper for Corn Icon
const CornIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corn"><path d="M9 12c-2 0-4-2-4-4V4c0-2 2-4 4-4h2c2 0 4 2 4 4v4c0 2-2 4-4 4Z"/><path d="M9 12v10"/><path d="m9 12-2 2"/><path d="m9 12 2 2"/><path d="m9 12-2-2"/><path d="m9 12 2-2"/></svg>
);

const getIconForCategory = (category: CommodityPriceData['category']) => {
    switch (category) {
        case 'exchange': return DollarSign;
        case 'vus': return LandPlot;
        case 'vmad': return TreePine;
        case 'crs': return Droplets;
        default: return DollarSign;
    }
};

interface UnderlyingAssetsTableProps {
    data: CommodityPriceData[];
    loading?: boolean;
}

export function UnderlyingAssetsTable({ data, loading }: UnderlyingAssetsTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);

  const handleRowClick = (asset: CommodityPriceData) => {
    if (loading || !asset.ticker) return;
    setSelectedAsset(asset);
  };
  
  const renderTableRows = () => {
    if (loading) {
        return Array.from({length: 7}).map((_, i) => (
             <TableRow key={i} className="cursor-wait">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                           <Skeleton className="h-4 w-4 rounded-full"/>
                        </div>
                        <div>
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                    <Skeleton className="h-5 w-20 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                    <Skeleton className="h-6 w-24 ml-auto" />
                </TableCell>
            </TableRow>
        ));
    }

    if (!data || data.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum ativo configurado. Adicione ativos na página de Configurações.
                </TableCell>
            </TableRow>
        );
    }
    
    return data.map((asset) => {
        const Icon = getIconForCategory(asset.category);

        return (
            <TableRow key={asset.name} onClick={() => handleRowClick(asset)} className="cursor-pointer">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">Fonte: MarketData</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                <AnimatedNumber value={asset.price} currency={asset.currency} />
              </TableCell>
              <TableCell className="text-right">
                  <div className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                      asset.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                  )}>
                      {asset.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                      <AnimatedNumber value={asset.change} formatter={(v) => `${v.toFixed(2)}%`} />
                  </div>
              </TableCell>
            </TableRow>
        );
    });
  };

  const hasAnyPriceData = data.some(asset => asset.price > 0);

  return (
    <div className="w-full">
      <ScrollArea className="h-[450px] w-full">
        <Table>
          {!loading && !hasAnyPriceData && (
              <TableCaption className="py-4">
                  Os preços ainda não foram carregados. Clique em "Atualizar Preços" para buscar os dados.
              </TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Variação (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {renderTableRows()}
          </TableBody>
        </Table>
      </ScrollArea>
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          icon={getIconForCategory(selectedAsset.category)}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
