
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { AssetIcon } from '@/lib/icons';
import { AssetDetailModal } from './asset-detail-modal';
import { usePriceChangeAnimation } from '@/hooks/use-price-change-animation';
import { Badge } from './ui/badge';

interface UnderlyingAssetsTableProps {
    data: CommodityPriceData[];
    loading?: boolean;
}

const categoryGroups = {
  'agricultural': 'Commodities Agrícolas',
  'material': 'Materiais e Recursos',
  'sustainability': 'Ativos de Sustentabilidade',
  'calculated': 'Índices Calculados',
  'index': 'Índices Principais',
  'sub-index': 'Sub-Índices',
  'vus': 'Valor de Uso do Solo',
  'vmad': 'Valor da Madeira',
  'crs': 'Custo de Responsabilidade Sócio-ambiental',
};

type CategoryKey = keyof typeof categoryGroups;

const categoryOrder: CategoryKey[] = ['agricultural', 'material', 'sustainability', 'sub-index', 'index'];


export function UnderlyingAssetsTable({ data, loading }: UnderlyingAssetsTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<CommodityPriceData | null>(null);
  const animationClasses = usePriceChangeAnimation(data);

  const groupedData = useMemo(() => {
    const groups: Record<string, CommodityPriceData[]> = {};
    
    data.forEach(asset => {
        // Find a matching category from the defined groups
        const groupKey = Object.keys(categoryGroups).find(key => asset.category.includes(key));
        const category = groupKey || asset.category;

        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(asset);
    });

    // Return as an array of [key, value] pairs, sorted by categoryOrder
    return Object.entries(groups).sort(([keyA], [keyB]) => {
        const indexA = categoryOrder.indexOf(keyA as CategoryKey);
        const indexB = categoryOrder.indexOf(keyB as CategoryKey);

        if (indexA === -1 && indexB === -1) return keyA.localeCompare(keyB); // fallback sort
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

  }, [data]);


  const handleRowClick = (asset: CommodityPriceData) => {
    setSelectedAsset(asset);
  };
  
  if (loading) {
    return (
        <div className="p-4 space-y-3">
          {Array.from({length: 5}).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
    );
  }

  if (groupedData.length === 0) {
     return (
        <div className="h-24 text-center flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Nenhum ativo configurado ou dados disponíveis.</p>
        </div>
     );
  }

  return (
    <div className="w-full">
        <Accordion type="multiple" defaultValue={groupedData.map(([key]) => key)} className="w-full">
            {groupedData.map(([category, assets]) => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:bg-muted/50 hover:no-underline">
                        <span className="flex-1 text-left">{categoryGroups[category as CategoryKey] || category}</span>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary">{assets.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
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
                                    {assets.map((asset) => {
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
                                                            <AssetIcon asset={asset} className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="font-medium">{asset.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground">{asset.lastUpdated}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {asset.price > 0 ? priceFormatted : <span className="text-muted-foreground">N/A</span>}
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
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

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
