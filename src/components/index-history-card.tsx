
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndexHistoryTable } from './index-history-table';
import { getUcsIndexHistory, getUcsIndexValue } from '@/lib/data-service';
import type { ChartData } from '@/lib/types';

interface IndexHistoryCardProps {
  // selectedDate prop is removed as this component will always show the general history
}

export function IndexHistoryCard({}: IndexHistoryCardProps) {
  const [historyData, setHistoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const fetchIndexData = async () => {
      try {
        setLoading(true);
        // We only need the history for the table/chart, and a check if it's configured
        const [history, latestValue] = await Promise.all([
          getUcsIndexHistory('1d'),
          getUcsIndexValue(),
        ]);
        setHistoryData(history);
        setIsConfigured(latestValue.isConfigured);
      } catch (error) {
        console.error('Erro ao carregar dados do índice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndexData();
  }, []); // Runs once on component mount

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Histórico do Índice UCS</CardTitle>
        <CardDescription>
          Evolução diária do Índice de Unidade de Crédito de Sustentabilidade (últimos 30 dias).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
          <IndexHistoryTable data={historyData} loading={loading} isConfigured={isConfigured} />
      </CardContent>
    </Card>
  );
}
