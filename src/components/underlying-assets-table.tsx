
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
import { ArrowDown, ArrowUp, DollarSign, LandPlot, TreePine, Droplets, HelpCircle } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { Skeleton } from './ui/skeleton';


const getIconForCategory = (category: CommodityPriceData['category']) => {
    switch (category) {
        case 'exchange': return DollarSign;
        case 'vus': return LandPlot;
        case 'vmad': return TreePine;
        case 'crs': return Droplets;
        default: return HelpCircle;
    }
};

interface UnderlyingAssetsTableProps {
    data: CommodityPriceData[];
    loading?: boolean;
    onManualUpdate?: (assetName: string) => void;
    updatingAssets?: Set<string>;
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
                    Nenhum ativo configurado ou dados disponíveis.
                </TableCell>
            </TableRow>
        );
    }
    
    return data.map((asset) => {
        const Icon = getIconForCategory(asset.category);

        return (
            <TableRow key={asset.id} onClick={() => handleRowClick(asset)} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-xs text-muted-foreground">Fonte: {asset.source || 'n/a'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                 {asset.price > 0 ? (
                    <AnimatedNumber value={asset.price} currency={asset.currency} />
                 ) : (
                    <span className="text-muted-foreground">R$ 0,00</span>
                 )}
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

  return (
    <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Último Preço</TableHead>
              <TableHead className="text-right">Variação (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {renderTableRows()}
          </TableBody>
        </Table>
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
