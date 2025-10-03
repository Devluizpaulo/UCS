'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteByDate } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CompositionAnalysisProps {
  targetDate: Date;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const componentNames: Record<string, string> = {
  vus: 'VUS (Uso do Solo)',
  vmad: 'VMAD (Madeira)',
  carbono_crs: 'Carbono CRS',
  Agua_CRS: 'Água CRS',
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export function CompositionAnalysis({ targetDate }: CompositionAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getQuoteByDate('valor_uso_solo', targetDate);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch composition data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [targetDate]);

  const chartData = useMemo(() => {
    if (!data?.componentes) return [];

    return Object.entries(data.componentes)
      .map(([key, value]) => ({
        name: componentNames[key] || key,
        value: value as number,
        percentage: data.porcentagens?.[key] || (((value as number) / data.valor) * 100),
      }))
      .filter(item => item.value > 0); // Não mostra componentes com valor zero no gráfico
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-72 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Indisponíveis</CardTitle>
          <CardDescription>Não foi possível carregar os dados de composição para a data selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72 text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhuma composição encontrada para {targetDate.toLocaleDateString('pt-BR')}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Composição do Índice "Valor de Uso do Solo"</CardTitle>
                <CardDescription>
                    Distribuição percentual dos componentes que formam o valor total de {formatCurrency(data.valor, 'BRL', 'valor_uso_solo')} em {data.data}.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value, 'BRL'), name]}
                    />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Valores dos Componentes</CardTitle>
                <CardDescription>Detalhes de cada componente do índice.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Componente</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">(%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chartData.map((item, index) => (
                            <TableRow key={item.name}>
                                <TableCell className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="font-medium">{item.name}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.value, 'BRL')}</TableCell>
                                <TableCell className="text-right font-mono">{item.percentage.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(data.valor, 'BRL', 'valor_uso_solo')}</TableCell>
                            <TableCell className="text-right font-mono">100.00%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
