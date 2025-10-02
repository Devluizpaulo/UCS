'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, ExternalLink } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';

interface AssetActionsProps {
  asset: CommodityPriceData;
}

export function AssetActions({ asset }: AssetActionsProps) {
  const { toast } = useToast();

  const handleTestAction = () => {
    toast({
      title: 'Ação de Teste Disparada',
      description: `Botão para o ativo "${asset.name}" foi clicado.`,
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTestAction}
      >
        <PlayCircle className="mr-2 h-4 w-4" />
        Testar
      </Button>
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
