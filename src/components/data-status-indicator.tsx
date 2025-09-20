
'use client';

import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { CommodityPriceData } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';

interface DataStatusIndicatorProps {
  asset: CommodityPriceData;
  allAssets: CommodityPriceData[];
}

export function DataStatusIndicator({ asset, allAssets }: DataStatusIndicatorProps) {
  if (!asset.isCalculated || !asset.missingComponents?.length) {
    return null;
  }

  const dependencies = asset.dependencies || [];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center text-amber-500 hover:text-amber-400 transition-colors">
          <AlertTriangle className="h-4 w-4" />
          <span className="sr-only">Status dos Dados</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Status dos Componentes</h4>
            <p className="text-sm text-muted-foreground">
              O valor deste índice pode estar incompleto devido à falta de dados de um ou mais componentes.
            </p>
          </div>
          <ul className="grid gap-2">
            {dependencies.map((depId) => {
              const component = allAssets.find(a => a.id === depId);
              const isMissing = asset.missingComponents?.includes(depId);
              const Icon = component ? getIconForCategory(component) : HelpCircle;
              
              return (
                <li key={depId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {component?.name || depId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isMissing ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className={isMissing ? 'text-red-500' : 'text-green-500'}>
                      {isMissing ? 'Offline' : 'Online'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
