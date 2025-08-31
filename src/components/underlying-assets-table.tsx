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
import { ArrowDown, ArrowUp, DollarSign, Euro, Leaf, Sprout, Wind, Fence, Beef } from 'lucide-react';
import type { Commodity, CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { AssetDetailModal } from './asset-detail-modal';

const commodityDetails: Commodity[] = [
  { name: 'Soja Futuros', icon: () => <span className="text-lg" data-ai-hint="soybean">🌱</span> },
  { name: 'Milho Futuros', icon: () => <span className="text-lg" data-ai-hint="corn">🌽</span>},
  { name: 'Boi Gordo Futuros', icon: Beef },
  { name: 'Madeira Futuros', icon: Fence },
  { name: 'Carbono Futuros', icon: Wind },
  { name: 'USD/BRL Histórico', icon: DollarSign },
  { name: 'EUR/BRL Histórico', icon: Euro },
];

interface UnderlyingAssetsTableProps {
    data?: CommodityPriceData[];
    loading?: boolean;
}

export function UnderlyingAssetsTable({ data, loading }: UnderlyingAssetsTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);

  const getIconForCommodity = (name: string) => {
    const details = commodityDetails.find(c => c.name === name);
    return details ? details.icon : DollarSign;
  };

  const handleRowClick = (asset: CommodityPriceData) => {
    setSelectedAsset(asset);
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Preço (BRL)</TableHead>
            <TableHead className="text-right">Variação (24h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 7 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : (
            data?.map((item) => {
              const Icon = getIconForCommodity(item.name);
              return (
                <TableRow key={item.name} onClick={() => handleRowClick(item)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">R$ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                        item.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                    )}>
                        {item.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                        {item.change.toFixed(2)}%
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          icon={getIconForCommodity(selectedAsset.name)}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
