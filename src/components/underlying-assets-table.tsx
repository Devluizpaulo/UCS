
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ArrowDown, ArrowUp, DollarSign, Euro, Beef, Leaf, TreePine, Recycle, RefreshCw, Loader2, Wheat } from 'lucide-react';
import type { CommodityConfig, CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Helper for Corn Icon
const CornIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corn"><path d="M9 12c-2 0-4-2-4-4V4c0-2 2-4 4-4h2c2 0 4 2 4 4v4c0 2-2 4-4 4Z"/><path d="M9 12v10"/><path d="m9 12-2 2"/><path d="m9 12 2 2"/><path d="m9 12-2-2"/><path d="m9 12 2-2"/></svg>
);

const getIconForCategory = (category: string) => {
    switch (category) {
        case 'exchange': return DollarSign;
        case 'agriculture': return Wheat;
        case 'forestry': return TreePine;
        case 'carbon': return Recycle;
        default: return DollarSign;
    }
};

interface UnderlyingAssetsTableProps {
    commodities?: CommodityPriceData[];
    loading?: boolean;
    updatingAssets?: Set<string>;
    onManualUpdate?: (assetName: string) => void;
}

export function UnderlyingAssetsTable({ commodities, loading, updatingAssets, onManualUpdate }: UnderlyingAssetsTableProps) {
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
                <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                </TableCell>
            </TableRow>
        ));
    }

    if (!commodities || commodities.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    Ainda não há dados de cotação. A atualização automática ocorrerá às 6h da manhã.
                </TableCell>
            </TableRow>
        );
    }
    
    return commodities.map((asset) => {
        const Icon = getIconForCategory(asset.category);
        const isUpdating = updatingAssets?.has(asset.name);

        return (
            <TableRow key={asset.name}>
              <TableCell onClick={() => handleRowClick(asset)} className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">Fonte: {asset.source}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell onClick={() => handleRowClick(asset)} className="text-right font-mono cursor-pointer">
                <AnimatedNumber value={asset.price} currency={asset.currency} />
              </TableCell>
              <TableCell onClick={() => handleRowClick(asset)} className="text-right cursor-pointer">
                  <div className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                      asset.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                  )}>
                      {asset.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                      <AnimatedNumber value={asset.change} formatter={(v) => `${v.toFixed(2)}%`} />
                  </div>
              </TableCell>
              <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onManualUpdate?.(asset.name)
                    }}
                    disabled={isUpdating}
                    aria-label={`Atualizar ${asset.name}`}
                  >
                    {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
              </TableCell>
            </TableRow>
        );
    });
  };


  return (
    <div className="w-full">
      <ScrollArea className="h-[450px] w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Variação (24h)</TableHead>
              <TableHead className="text-right w-[50px]">Atualizar</TableHead>
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
