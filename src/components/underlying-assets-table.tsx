
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
import { Euro } from 'lucide-react';
import { AssetDetailModal } from './asset-detail-modal';

interface UnderlyingAssetsTableProps {
    data: CommodityPriceData[];
    loading?: boolean;
}

export function UnderlyingAssetsTable({ data, loading }: UnderlyingAssetsTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);

  const handleRowClick = (asset: CommodityPriceData) => {
    setSelectedAsset(asset);
  };
  
  if (loading) {
    return (
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
          {Array.from({length: 7}).map((_, i) => (
               <TableRow key={i}>
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
                   <TableCell>
                       <Skeleton className="h-5 w-24" />
                   </TableCell>
                  <TableCell className="text-right font-mono">
                      <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-6 w-24 ml-auto" />
                  </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="w-full">
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

                  return (
                      <TableRow key={asset.id} onClick={() => handleRowClick(asset)} className="cursor-pointer">
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
                              <div className="flex items-center justify-end gap-1">
                                {asset.id === 'eur' && <Euro className="h-4 w-4" />}
                                {priceFormatted}
                              </div>
                           ) : (
                              <span className="text-muted-foreground">N/A</span>
                           )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                                asset.price === 0 ? "border-transparent text-muted-foreground" : changeColor.replace('text-', 'border-') + ' ' + changeColor
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
