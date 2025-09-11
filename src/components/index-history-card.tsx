'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndexHistoryTable } from './index-history-table';
import { getUcsIndexValue } from '@/lib/data-service';
import type { UcsData } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface IndexHistoryCardProps {
  selectedDate?: string;
}

export function IndexHistoryCard({ selectedDate }: IndexHistoryCardProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndexData = async () => {
      try {
        setLoading(true);
        // A função getUcsIndexValue retorna { latest, history }
        const { latest, history } = await getUcsIndexValue('1d', selectedDate);
        // Os dados já estão sendo usados pelo IndexHistoryTable
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
          Evolução histórica do Índice de Unidade de Crédito de Sustentabilidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <IndexHistoryTable selectedDate={selectedDate} isConfigured={true} />
        )}
      </CardContent>
    </Card>
  );
}