'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, ExternalLink } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';

interface AssetActionsProps {
  asset: CommodityPriceData;
  onEdit: () => void;
}

export function AssetActions({ asset, onEdit }: AssetActionsProps) {
  
  // Apenas ativos cotados (não calculados) podem ser editados
  const canEdit = asset.category === 'agricultural' || asset.category === 'exchange' || asset.category === 'material' ;

  return (
    <div className="flex items-center justify-center gap-2">
      {canEdit && (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onEdit}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                 <TooltipContent>
                    <p>Editar valor</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      )}
      {asset.sourceUrl && (
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={asset.sourceUrl} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Ver fonte no investing.com</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      )}
    </div>
  );
}
