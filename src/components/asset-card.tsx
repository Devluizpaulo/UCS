
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getIconForCategory } from '@/lib/icons';

interface AssetCardProps {
  asset?: CommodityPriceData;
  loading?: boolean;
  className?: string;
}

export function AssetCard({ asset, loading, className }: AssetCardProps) {
  if (loading || !asset) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mt-1" />
           <p className="text-xs text-muted-foreground pt-4">
            <Skeleton className="h-4 w-24" />
          </p>
        </CardContent>
      </Card>
    );
  }

  const Icon = getIconForCategory(asset);
  const changeColor = asset.change >= 0 ? 'text-primary' : 'text-destructive';
  
  const priceFormatted = formatCurrency(asset.price, asset.currency, asset.id);

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{asset.name}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {asset.price > 0 ? priceFormatted : <span className="text-muted-foreground">-</span>}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {asset.price > 0 ? (
              <span className={cn("font-semibold", changeColor)}>
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
              </span>
          ) : 'Variação indisponível'}
        </p>
      </CardContent>
    </Card>
  );
}
