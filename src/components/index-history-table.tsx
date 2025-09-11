
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ChartData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

interface IndexHistoryTableProps {
    data?: ChartData[];
    loading?: boolean;
    isConfigured: boolean;
    selectedDate?: string;
}

export function IndexHistoryTable({ data, loading, isConfigured, selectedDate }: IndexHistoryTableProps) {
  
  const renderContent = () => {
    if (loading) {
        return Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
          </TableRow>
        ));
    }
    
    if (!isConfigured) {
        return (
            <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    Configure a fórmula do índice para ver o histórico.
                </TableCell>
            </TableRow>
        );
    }
    
    if (!data || data.length === 0) {
         return (
            <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    Ainda não há dados históricos para o índice.
                </TableCell>
            </TableRow>
        );
    }

    return data.slice().reverse().map((item) => (
        <TableRow key={item.time}>
            <TableCell>
                <div className="font-medium">{item.time}</div>
            </TableCell>
            <TableCell className="text-right font-mono">{item.value.toFixed(4)}</TableCell>
        </TableRow>
    ));
  }

  return (
    <ScrollArea className="h-[450px] w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderContent()}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
