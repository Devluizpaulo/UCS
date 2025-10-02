'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Globe, Database } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { ASSET_DEPENDENCIES } from '@/lib/dependency-service';

interface AssetActionsProps {
  asset: CommodityPriceData;
  onEdit: (asset: CommodityPriceData) => void;
}

export function AssetActions({ asset, onEdit }: AssetActionsProps) {
  
  const assetInfo = ASSET_DEPENDENCIES[asset.id];
  const canEdit = assetInfo?.calculationType === 'base';
  
  const hasExternalSource = Boolean(asset.sourceUrl) && (asset.sourceUrl || '').trim() !== '';
  
  const defaultSourceUrls: Record<string, string> = {
    'usd': 'https://br.investing.com/currencies/usd-brl-historical-data',
    'eur': 'https://br.investing.com/currencies/eur-brl-historical-data',
    'soja': 'https://br.investing.com/commodities/us-soybeans-historical-data',
    'milho': 'https://br.investing.com/commodities/us-corn-historical-data',
    'boi_gordo': 'https://br.investing.com/commodities/live-cattle-historical-data',
    'carbono': 'https://br.investing.com/commodities/carbon-emissions-historical-data',
    'madeira': 'https://br.investing.com/commodities/lumber-historical-data'
  };
  
  const finalSourceUrl = asset.sourceUrl || defaultSourceUrls[asset.id];
  const shouldShowSourceLink = hasExternalSource || (canEdit && !!finalSourceUrl);

  return (
    <div className="flex items-center justify-center gap-1">
      <TooltipProvider>
        {/* Botão de Editar */}
        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(asset);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar valor</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Botão de Link Externo */}
        {shouldShowSourceLink && finalSourceUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="h-8 w-8 p-0"
              >
                <Link 
                  href={finalSourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="h-3 w-3" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver fonte no Investing.com</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Indicador para ativos calculados (apenas para os que NÃO são editáveis) */}
        {!canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                disabled
                className="h-8 w-8 p-0 opacity-50"
              >
                <Database className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Valor calculado automaticamente</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
