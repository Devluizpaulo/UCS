
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AssetDetailModal } from './asset-detail-modal';
import { getIconForCategory } from './underlying-assets-table';

interface AssetCardProps {
  asset?: CommodityPriceData;
  loading?: boolean;
  changeStatus?: 'up' | 'down';
}

export function AssetCard({ asset, loading, changeStatus }: AssetCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    if (!loading && asset) {
      setIsModalOpen(true);
    }
  };

  if (loading || !asset) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mt-1" />
          <div className="flex items-baseline gap-2 mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = getIconForCategory(asset);
  const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
  const isSpecialNumberFormat = asset.id === 'agua' || asset.id === 'custo_agua';
  
  const priceFormatted = isSpecialNumberFormat
    ? asset.price.toFixed(2) 
    : formatCurrency(asset.price, asset.currency);
  
  const absoluteChangeFormatted = isSpecialNumberFormat
    ? asset.absoluteChange.toFixed(2) 
    : formatCurrency(Math.abs(asset.absoluteChange), asset.currency);


  const flashClass = changeStatus === 'up' 
    ? 'animate-flash-green' 
    : changeStatus === 'down' 
    ? 'animate-flash-red' 
    : '';

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
            "cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md",
            flashClass
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{asset.name}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {asset.price > 0 ? priceFormatted : <span className="text-muted-foreground">-</span>}
          </div>
          <div className={cn("flex items-baseline gap-2 text-xs", changeColor)}>
            {asset.price > 0 && (
              <>
                <span>{asset.absoluteChange >= 0 ? '+' : ''}{absoluteChangeFormatted}</span>
                <span>({asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%)</span>
              </>
            )}
          </div>
           <p className="text-xs text-muted-foreground pt-2">
            {asset.lastUpdated}
          </p>
        </CardContent>
      </Card>

      {asset && (
        <AssetDetailModal
          asset={asset}
          icon={Icon}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
