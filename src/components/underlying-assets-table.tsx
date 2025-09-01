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
import { ArrowDown, ArrowUp, DollarSign, Euro, Beef, Leaf, TreePine, Recycle } from 'lucide-react';
import type { Commodity, CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { Skeleton } from './ui/skeleton';
import { COMMODITY_TICKER_MAP } from '@/lib/yahoo-finance-config-data';


// Helper component for Corn icon
const CornIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-corn">
        <path d="M9 12c-2 0-4-2-4-4V4c0-2 2-4 4-4h2c2 0 4 2 4 4v4c0 2-2 4-4 4Z"/>
        <path d="M9 12v10"/>
        <path d="m9 12-2 2"/>
        <path d="m9 12 2 2"/>
        <path d="m9 12-2-2"/>
        <path d="m9 12 2-2"/>
    </svg>
);

const commodityDetails: Commodity[] = [
  { name: 'USD/BRL Histórico', icon: DollarSign },
  { name: 'EUR/BRL Histórico', icon: Euro },
  { name: 'Boi Gordo Futuros - Ago 25 (BGIc1)', icon: Beef },
  { name: 'Soja Futuros', icon: Leaf },
  { name: 'Milho Futuros', icon: CornIcon },
  { name: 'Madeira Futuros', icon: TreePine },
  { name: 'Carbono Futuros', icon: Recycle },
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
    if (loading || !asset.ticker) return;
    setSelectedAsset(asset);
  };
  
  const renderTableRows = () => {
    // If loading, render skeleton rows for all possible commodities
    if (loading) {
        return commodityDetails.map((commodity) => (
            <TableRow key={commodity.name} className="cursor-wait">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{commodity.name}</div>
                    <div className="text-xs text-muted-foreground">Aguardando dados...</div>
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

    // If not loading and no data, show message
    if (!data || data.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                    Ainda não há dados de cotação. A primeira atualização automática ocorrerá em breve.
                </TableCell>
            </TableRow>
        );
    }
    
    // If data is available, render the actual data rows
    return data.map((item) => {
        const Icon = getIconForCommodity(item.name);
        const commodityConfig = COMMODITY_TICKER_MAP[item.name];
        const currency = commodityConfig?.currency || 'USD';

        return (
            <TableRow key={item.name} onClick={() => handleRowClick(item)} className="cursor-pointer">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.lastUpdated}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                <AnimatedNumber value={item.price} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                  <div className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                      item.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                  )}>
                      {item.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                      <AnimatedNumber value={item.change} formatter={(v) => `${v.toFixed(2)}%`} />
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
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Variação (Fech.)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {renderTableRows()}
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
