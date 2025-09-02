
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';
import type { CommodityConfig } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface CommoditySourcesTableProps {
  data: CommodityConfig[];
  loading: boolean;
  onEdit: (commodity: CommodityConfig) => void;
  onDelete: (commodityId: string) => void;
}

export function CommoditySourcesTable({ data, loading, onEdit, onDelete }: CommoditySourcesTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!data || data.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg">
            <p className="text-muted-foreground">Nenhum ativo configurado.</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um novo ativo para começar a monitorar.</p>
        </div>
      )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome do Ativo</TableHead>
            <TableHead>Ticker</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead className="text-right w-[50px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((commodity) => (
            <TableRow key={commodity.id}>
              <TableCell className="font-medium">{commodity.name}</TableCell>
              <TableCell className="font-mono text-xs">{commodity.ticker}</TableCell>
              <TableCell className="text-sm text-muted-foreground capitalize">{commodity.category}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{commodity.source || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(commodity)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(commodity.id)} className="text-destructive">
                       <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
