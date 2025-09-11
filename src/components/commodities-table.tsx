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
import { ArrowDown, ArrowUp, LandPlot, TreePine, Droplets } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { ScrollArea } from './ui/scroll-area';

const getIconForCategory = (category: CommodityPriceData['category']) => {
  switch (category) {
    case 'vus': return LandPlot;
    case 'vmad': return TreePine;
    case 'crs': return Droplets;
    default: return LandPlot;
  }
};

interface CommoditiesTableProps {
  data: CommodityPriceData[];
  selectedDate?: string;
}

export function CommoditiesTable({ data, selectedDate }: CommoditiesTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);

  const handleRowClick = (asset: CommodityPriceData) => {
    if (!asset.ticker) return;
    setSelectedAsset(asset);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma commodity configurada.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ScrollArea className="h-[300px] w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commodity</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((commodity) => {
              const Icon = getIconForCategory(commodity.category);
              
              return (
                <TableRow 
                  key={commodity.name} 
                  onClick={() => handleRowClick(commodity)} 
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{commodity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Fonte: {commodity.source || 'n/a'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <AnimatedNumber value={commodity.price} currency={commodity.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                      commodity.change >= 0 
                        ? "border-primary/50 text-primary" 
                        : "border-destructive/50 text-destructive"
                    )}>
                      {commodity.change >= 0 
                        ? <ArrowUp className="mr-1 h-3 w-3" /> 
                        : <ArrowDown className="mr-1 h-3 w-3" />
                      }
                      <AnimatedNumber 
                        value={commodity.change} 
                        formatter={(v) => `${v.toFixed(2)}%`} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          icon={getIconForCategory(selectedAsset.category)}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}