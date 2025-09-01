'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getRiskAnalysisData } from '@/lib/data-service';
import type { RiskAnalysisData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const getVolatilityBadge = (volatility: number) => {
    if (volatility > 4) return { variant: 'destructive', label: 'Alta' };
    if (volatility > 2) return { variant: 'secondary', label: 'Média' };
    return { variant: 'default', label: 'Baixa' };
};

const getCorrelationBadge = (correlation: number) => {
    if (correlation > 0.5) return 'Positiva Forte';
    if (correlation > 0.1) return 'Positiva';
    if (correlation < -0.5) return 'Negativa Forte';
    if (correlation < -0.1) return 'Negativa';
    return 'Neutra';
};

export function RiskAnalysis() {
  const [riskData, setRiskData] = useState<RiskAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRiskAnalysisData();
        setRiskData(data);
      } catch (err) {
        console.error("Failed to fetch risk analysis data:", err);
        setError("Não foi possível carregar os dados de análise de risco. Tente atualizar a página.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Risco</CardTitle>
        <CardDescription>
            Análise de volatilidade e correlação dos ativos subjacentes em relação ao Índice UCS, com insights gerados por IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
             </div>
        ) : error ? (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : riskData ? (
          <>
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Sumário da IA</AlertTitle>
              <AlertDescription>
                {riskData.summary}
              </AlertDescription>
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-center">Volatilidade (30d)</TableHead>
                  <TableHead className="text-center">Correlação com Índice</TableHead>
                  <TableHead className="text-right">Sentimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskData.metrics.map((item) => {
                   const volatilityInfo = getVolatilityBadge(item.volatility);
                   const correlationInfo = getCorrelationBadge(item.correlation);

                    return (
                        <TableRow key={item.asset}>
                            <TableCell className="font-medium">{item.asset}</TableCell>
                            <TableCell className="text-center">
                            <Badge variant={volatilityInfo.variant} className="bg-opacity-50">
                                {volatilityInfo.label}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono">{item.correlation.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{correlationInfo}</TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
