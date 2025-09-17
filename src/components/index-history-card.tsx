
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndexHistoryTable } from './index-history-table';
import type { ChartData } from '@/lib/types';

interface IndexHistoryCardProps {
  initialData: ChartData[];
  isConfigured: boolean;
  loading: boolean;
}

export function IndexHistoryCard({ initialData, isConfigured, loading }: IndexHistoryCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico do Índice UCS</CardTitle>
        <CardDescription>
          Evolução diária do Índice de Unidade de Crédito de Sustentabilidade (últimos 30 dias).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
          <IndexHistoryTable data={initialData} loading={loading} isConfigured={isConfigured} />
      </CardContent>
    </Card>
  );
}
