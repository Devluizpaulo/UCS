
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndexHistoryTable } from './index-history-table';
import { getUcsIndexValue } from '@/lib/data-service';
import type { ChartData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface IndexHistoryCardProps {
  selectedDate?: string;
}

export function IndexHistoryCard({ selectedDate }: IndexHistoryCardProps) {
  const [historyData, setHistoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const fetchIndexData = async () => {
      try {
        setLoading(true);
        const { latest, history } = await getUcsIndexValue('1d', selectedDate);
        setHistoryData(history);
        setIsConfigured(latest.isConfigured);
      } catch (error) {
        console.error('Erro ao carregar dados do índice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndexData();
  }, [selectedDate]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico do Índice UCS</CardTitle>
        <CardDescription>
          Evolução diária do Índice de Unidade de Crédito de Sustentabilidade (últimos 30 dias).
        </CardDescription>
      </CardHeader>
      <CardContent>
          <IndexHistoryTable data={historyData} loading={loading} isConfigured={isConfigured} />
      </CardContent>
    </Card>
  );
}
