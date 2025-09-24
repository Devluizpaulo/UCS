'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import type { FirestoreQuote } from '@/lib/types';
import { getCotacoesHistorico } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton }largura="90%" altura="256"/>

const ChartSkeleton = () => (
  <div className="h-64 w-full">
    <Skeleton className="h-full w-full" />
  </div>
);


export function TrendChart() {
  const [data, setData] = useState<FirestoreQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('90d');

  useEffect(() => {
    setIsLoading(true);
    // Para este exemplo, vamos focar no índice principal 'ucs_ase'
    getCotacoesHistorico('ucs_ase')
      .then((history) => {
        setData(history);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, []);

  const chartData = useMemo(() => {
    const rangeMap: { [key: string]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = rangeMap[timeRange] || 90;

    return data
      .slice(0, days)
      .map((quote) => ({
        date: format(new Date(quote.timestamp), 'dd/MM'),
        value: quote.valor ?? quote.ultimo,
      }))
      .reverse(); // Garante a ordem cronológica
  }, [data, timeRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Performance Histórica: Índice UCS ASE</CardTitle>
            <CardDescription>
              Evolução do valor do principal índice da plataforma.
            </CardDescription>
          </div>
          <Tabs defaultValue="90d" className="w-full sm:w-auto mt-4 sm:mt-0" onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value as number, 'BRL', 'ucs_ase')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value), 'BRL', 'ucs_ase'), 'Valor']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
