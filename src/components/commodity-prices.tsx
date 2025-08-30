"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDown, ArrowUp, Leaf, Droplets, Gem, Sprout, Footprints, TreePine } from 'lucide-react';
import type { Commodity } from '@/lib/types';
import { cn } from '@/lib/utils';


const initialCommodities: Omit<Commodity, 'price' | 'change'>[] = [
  { name: 'Créditos de Carbono', icon: Leaf },
  { name: 'Boi Gordo', icon: () => <span className="text-lg" data-ai-hint="cow">🐄</span> },
  { name: 'Milho', icon: () => <span className="text-lg" data-ai-hint="corn">🌽</span> },
  { name: 'Soja', icon: () => <span className="text-lg" data-ai-hint="plant">🌱</span> },
  { name: 'Madeira', icon: TreePine },
  { name: 'Água', icon: Droplets },
];

const generateCommodityData = (): Commodity[] => {
  return initialCommodities.map(c => ({
    ...c,
    price: 50 + Math.random() * 100,
    change: Math.random() * 5 - 2.5
  }));
};

export function CommodityPrices() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  
  useEffect(() => {
    setCommodities(generateCommodityData());
    
    const interval = setInterval(() => {
       setCommodities(prevCommodities => {
         return prevCommodities.map(c => {
           const change = (Math.random() - 0.5) * 0.5;
           const newPrice = c.price * (1 + change / 100);
           return { ...c, price: newPrice, change: c.change + change };
         })
       })
    }, 7000); // Slower update for commodities

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ativos Subjacentes</CardTitle>
        <CardDescription>Preços em tempo real das commodities no índice.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commodity</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Variação (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commodities.map((item) => {
              const Icon = item.icon;
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
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
