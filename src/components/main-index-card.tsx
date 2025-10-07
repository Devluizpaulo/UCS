
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CommodityPriceData } from '@/lib/types';
import { AssetIcon } from '@/lib/icons';
import { AssetDetailModal } from './asset-detail-modal';
import { useState } from 'react';

interface MainIndexCardProps {
  asset: CommodityPriceData;
  isMain?: boolean;
}

export function MainIndexCard({ asset, isMain = false }: MainIndexCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
  const ChangeIcon = asset.change >= 0 ? ArrowUp : ArrowDown;
  
  // Condicionais para o estilo do card principal
  const mainCardClasses = isMain 
    ? 'bg-card border-primary/50 hover:border-primary shadow-lg' 
    : 'bg-card';
  const mainCardTitleClasses = isMain ? 'text-primary' : '';
  const mainCardDescriptionClasses = 'text-muted-foreground';
  const mainCardPriceClasses = 'text-foreground';
  const mainCardChangeClasses = changeColor;

  return (
    <>
      <Card 
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "cursor-pointer hover-lift smooth-border transition-all duration-300",
          mainCardClasses
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isMain ? "bg-primary/10" : "bg-muted"
                )}>
                    <AssetIcon asset={asset} className={cn("h-5 w-5", isMain ? "text-primary" : "text-muted-foreground")} />
                </div>
                <CardTitle className={cn("text-lg", mainCardTitleClasses, isMain && "text-xl")}>{asset.name}</CardTitle>
            </div>
            <div className={cn("text-sm", mainCardDescriptionClasses)}>{asset.unit}</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-bold font-mono", mainCardPriceClasses, isMain ? "text-4xl" : "text-3xl")}>
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm mt-1">
            <div className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', 
                changeColor,
                asset.change >= 0 ? 'bg-primary/10' : 'bg-destructive/10'
            )}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              <span>{asset.change.toFixed(2)}%</span>
            </div>
            <p className={cn("text-xs truncate", mainCardDescriptionClasses)}>{asset.description}</p>
          </div>
        </CardContent>
      </Card>
      {isModalOpen && (
         <AssetDetailModal
            asset={asset}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}
