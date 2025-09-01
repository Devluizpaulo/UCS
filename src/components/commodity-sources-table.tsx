
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit } from 'lucide-react';
import type { CommodityMap, CommodityConfig } from '@/lib/types';
import { EditCommodityModal } from './edit-commodity-modal';

interface CommoditySourcesTableProps {
  data: CommodityMap | null;
  loading: boolean;
  isSaving: boolean;
  onSave: (updatedCommodity: CommodityConfig) => void;
}

export function CommoditySourcesTable({ data, loading, isSaving, onSave }: CommoditySourcesTableProps) {
  const [editingCommodity, setEditingCommodity] = useState<CommodityConfig | null>(null);

  const commodities = data ? Object.entries(data).map(([name, config]) => ({ name, ...config })) : [];

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Ativo</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commodities.map((commodity) => (
              <TableRow key={commodity.name}>
                <TableCell className="font-medium">{commodity.name}</TableCell>
                <TableCell className="font-mono text-xs">{commodity.ticker}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{commodity.category}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditingCommodity(commodity)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCommodity && (
        <EditCommodityModal
          isOpen={!!editingCommodity}
          onClose={() => setEditingCommodity(null)}
          commodity={editingCommodity}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}
    </>
  );
}
