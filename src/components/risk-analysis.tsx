
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RiskAnalysisData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { getCommodities } from '@/lib/commodity-config-service';
import { getUcsIndexValue } from '@/lib/data-service';
import { getAssetHistoricalData } from '@/lib/marketdata-service';
import { calculate_volatility, calculate_correlation } from '@/lib/statistics';

async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
    const commodities = await getCommodities();
    const ucsHistoryData = await getUcsIndexValue('1d'); // Use daily data for correlation
    const ucsReturns = ucsHistoryData.history.map(d => d.value).slice(1).map((v, i, a) => (v / a[i-1]) -1);

    const metrics = [];

    for (const asset of commodities) {
        try {
            const assetHistory = await getAssetHistoricalData(asset.name, '1d');
            if (assetHistory.length < 2) continue;

            const assetReturns = assetHistory.map(d => d.close).slice(1).map((v, i, a) => (v / a[i-1]) -1);
            const volatility = calculate_volatility(assetReturns);
            
            // Ensure array lengths match for correlation
            const correlation = calculate_correlation(ucsReturns.slice(-assetReturns.length), assetReturns);
            
            metrics.push({ asset: asset.name, volatility, correlation });
        } catch (error) {
            console.error(`Could not analyze risk for ${asset.name}:`, error);
        }
    }
    return { metrics };
}


const getVolatilityBadge = (volatility: number) => {
    if (volatility > 4) return { variant: 'destructive', label: 'Alta' } as const;
    if (volatility > 2) return { variant: 'secondary', label: 'Média' } as const;
    return { variant: 'default', label: 'Baixa' } as const;
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
            Análise de volatilidade e correlação dos ativos subjacentes em relação ao Índice UCS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
             </div>
        ) : error ? (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : riskData ? (
          <>
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
