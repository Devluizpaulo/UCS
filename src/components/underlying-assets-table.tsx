"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDown, ArrowUp, Leaf, Droplets, TreePine } from 'lucide-react';
import type { Commodity, CommodityPriceData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getCommodityPrices } from '@/ai/flows/get-commodity-prices-flow';
import { Skeleton } from './ui/skeleton';

const commodityDetails: Commodity[] = [
  { name: 'Créditos de Carbono', icon: Leaf },
  { name: 'Boi Gordo', icon: () => <span className="text-lg" data-ai-hint="cow">🐄</span> },
  { name: 'Milho', icon: () => <span className="text-lg" data-ai-hint="corn">🌽</span> },
  { name: 'Soja', icon: () => <span className="text-lg" data-ai-hint="plant">🌱</span> },
  { name: 'Madeira', icon: TreePine },
  { name: 'Água', icon: Droplets },
];

export function UnderlyingAssetsTable() {
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        const prices = await getCommodityPrices({ commodities: commodityDetails.map(c => c.name) });
        setCommodities(prices);
      } catch (error) {
        console.error("Failed to fetch commodity prices:", error);
        // Optionally, set some error state to display to the user
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000); 

    return () => clearInterval(interval);
  }, []);

  const getIconForCommodity = (name: string) => {
    const details = commodityDetails.find(c => c.name === name);
    return details ? details.icon : Leaf;
  };

  return (
    <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Preço (BRL)</TableHead>
              <TableHead className="text-right">Variação (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : (
              commodities.map((item) => {
                const Icon = getIconForCommodity(item.name);
                return (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">R$ {item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors",
                          item.change >= 0 ? "border-primary/50 text-primary" : "border-destructive/50 text-destructive"
                      )}>
                          {item.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                          {item.change.toFixed(2)}%
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
    </div>
  );
}
