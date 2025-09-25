
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
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { getIconForCategory } from '@/lib/icons';
import { AssetDetailModal } from './asset-detail-modal';
import { Card } from './ui/card';
import { usePriceChangeAnimation } from '@/hooks/use-price-change-animation';

interface UnderlyingAssetsTableProps {
    data: CommodityPriceData[];
    loading?: boolean;
}

export function UnderlyingAssetsTable({ data, loading }: UnderlyingAssetsTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);
  const animationClasses = usePriceChangeAnimation(data);


  const handleRowClick = (asset: CommodityPriceData) => {
    setSelectedAsset(asset);
  };
  
  if (loading) {
    return (
        <div className="p-4 space-y-3">
          {Array.from({length: 7}).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
    );
  }

  return (
    <div className="w-full">
        {/* Desktop View: Table */}
        <div className="hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Último Preço</TableHead>
                    <TableHead className="text-right">Variação (24h)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data && data.length > 0 ? (
                    data.map((asset) => {
                        const Icon = getIconForCategory(asset);
                        const priceFormatted = formatCurrency(asset.price, asset.currency, asset.id);
                        const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
                        const animationClass = animationClasses[asset.id];

                        return (
                            <TableRow 
                                key={asset.id} 
                                onClick={() => handleRowClick(asset)} 
                                className={cn("cursor-pointer", animationClass)}
                            >
                                <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="font-medium">{asset.name}</div>
                                </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground">{asset.lastUpdated}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                {asset.price > 0 ? (
                                    priceFormatted
                                ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className={cn(
                                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                                        asset.price === 0 ? "border-transparent text-muted-foreground" : `border-transparent bg-${changeColor.replace('text-', '')}/20 ${changeColor}`
                                    )}>
                                        {asset.price > 0 ? `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%` : '-'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum ativo configurado ou dados disponíveis.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden p-4 space-y-3">
            {data && data.length > 0 ? (
                data.map((asset) => {
                    const Icon = getIconForCategory(asset);
                    const priceFormatted = formatCurrency(asset.price, asset.currency, asset.id);
                    const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
                    const animationClass = animationClasses[asset.id];
                    
                    return (
                        <Card 
                            key={asset.id} 
                            onClick={() => handleRowClick(asset)} 
                            className={cn("p-3 cursor-pointer", animationClass)}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-semibold truncate max-w-[150px] sm:max-w-xs">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.lastUpdated}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                     <p className="font-mono font-semibold">
                                        {asset.price > 0 ? priceFormatted : <span className="text-muted-foreground">N/A</span>}
                                     </p>
                                     <div className={cn(
                                        "text-xs font-semibold",
                                        asset.price > 0 ? changeColor : 'text-muted-foreground'
                                     )}>
                                        {asset.price > 0 ? `${asset.change.toFixed(2)}%` : '-'}
                                     </div>
                                </div>
                            </div>
                        </Card>
                    );
                })
            ) : (
                 <div className="h-24 text-center flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum ativo disponível.</p>
                </div>
            )}
        </div>


        {selectedAsset && (
            <AssetDetailModal
                asset={selectedAsset}
                isOpen={!!selectedAsset}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedAsset(null);
                    }
                }}
            />
        )}
    </div>
  );
}
