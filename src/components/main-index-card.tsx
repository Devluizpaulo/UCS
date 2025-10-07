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

  return (
    <>
      <Card 
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "cursor-pointer hover-lift smooth-border",
          isMain && "modern-gradient border-primary/50 shadow-primary/10"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                     isMain ? "bg-primary/20 text-primary" : "bg-muted"
                )}>
                    <AssetIcon asset={asset} className="h-5 w-5" />
                </div>
                <CardTitle className={cn("text-lg", isMain && "text-xl")}>{asset.name}</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">{asset.unit}</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-bold font-mono", isMain ? "text-4xl" : "text-3xl")}>
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className={cn('flex items-center font-semibold', changeColor)}>
              <ChangeIcon className="h-4 w-4 mr-1" />
              <span>{asset.change.toFixed(2)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{asset.description}</p>
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
