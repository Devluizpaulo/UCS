
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
import { AlertTriangle } from 'lucide-react';

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

  // Verifica se todos os dados estão bloqueados
  const allBlocked = data.length > 0 && data.every(asset => asset.isBlocked);
  const someBlocked = data.some(asset => asset.isBlocked);
  const blockReason = data.find(asset => asset.isBlocked)?.blockReason;

  if (groupedData.length === 0) {
     return (
        <div className="h-24 text-center flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Nenhum ativo configurado ou dados disponíveis.</p>
        </div>
     );
  }

  // Exibe aviso se todos os dados estão indisponíveis
  if (allBlocked) {
    return (
      <div className="h-32 text-center flex flex-col items-center justify-center p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-600">
          <span className="font-medium">Dados Indisponíveis</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Cotações indisponíveis: {blockReason}
        </p>
        <p className="text-xs text-muted-foreground">
          Os dados serão exibidos no próximo dia útil
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
        {/* Aviso quando alguns dados estão indisponíveis */}
        {someBlocked && !allBlocked && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Alguns dados estão indisponíveis: {blockReason}
              </span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Cotações serão exibidas no próximo dia útil
            </p>
          </div>
        )}
        
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
                            <Table className="table-fixed w-full">
                                <colgroup>
                                  <col className="w-[48%]" />
                                  <col className="w-[18%]" />
                                  <col className="w-[18%]" />
                                  <col className="w-[16%]" />
                                </colgroup>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="truncate">Ativo</TableHead>
                                        <TableHead className="truncate">Última Atualização</TableHead>
                                        <TableHead className="text-right truncate">Último Preço</TableHead>
                                        <TableHead className="text-right truncate">Variação (24h)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assets.map((asset) => {
                                        const priceFormatted = formatCurrency(asset.price, asset.currency, asset.id);
                                        const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
                                        const animationClass = animationClasses[asset.id];
                                        const isBlocked = asset.isBlocked;

                                        return (
                                            <TableRow 
                                                key={asset.id} 
                                                onClick={() => !isBlocked && handleRowClick(asset)} 
                                                className={cn(
                                                    isBlocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer", 
                                                    animationClass
                                                )}
                                            >
                                                <TableCell className="align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "flex h-8 w-8 items-center justify-center rounded-full",
                                                            isBlocked ? "bg-amber-100" : "bg-muted"
                                                        )}>
                                                            <AssetIcon asset={asset} className={cn("h-4 w-4", isBlocked ? "text-amber-600" : "text-muted-foreground")} />
                                                        </div>
                                                        <div className={cn(
                                                            "font-medium",
                                                            isBlocked && "text-muted-foreground"
                                                        )}>
                                                            {asset.name}
                                                        </div>
                                                        {isBlocked && (
                                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                                                                Indisponível
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    <div className={cn(
                                                        "text-sm",
                                                        isBlocked ? "text-amber-600 font-medium" : "text-muted-foreground"
                                                    )}>
                                                        {asset.lastUpdated}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono align-middle">
                                                    {isBlocked ? (
                                                        <span className="text-amber-600">Indisponível</span>
                                                    ) : asset.price > 0 ? (
                                                        priceFormatted
                                                    ) : (
                                                        <span className="text-muted-foreground">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right align-middle">
                                                    {isBlocked ? (
                                                        <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                                                            Indisponível
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                                                            asset.price === 0 ? "border-transparent text-muted-foreground" : `border-transparent bg-${changeColor.replace('text-', '')}/20 ${changeColor}`
                                                        )}>
                                                            {asset.price > 0 ? `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%` : '-'}
                                                        </div>
                                                    )}
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
