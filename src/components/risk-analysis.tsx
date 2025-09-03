
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
import { getFormulaParameters } from '@/lib/formula-service';

async function getRiskAnalysisData(): Promise<RiskAnalysisData> {
    const [commodities, ucsHistoryData, formulaParams] = await Promise.all([
        getCommodities(),
        getUcsIndexValue('1d'), // Use daily data for correlation
        getFormulaParameters(),
    ]);

    if (!formulaParams.isConfigured) {
        return { metrics: [] }; // Return empty if formula is not configured
    }
    
    const ucsReturns = ucsHistoryData.history.map(d => d.value).slice(1).map((v, i, a) => (v / a[i-1]) -1);
    
    const metricsPromises = commodities.map(async (asset) => {
        try {
            const assetHistory = await getAssetHistoricalData(asset.name, '1d');
            if (assetHistory.length < 2) return null;

            const assetReturns = assetHistory.map(d => d.close).slice(1).map((v, i, a) => (v / a[i-1]) -1);
            const volatility = calculate_volatility(assetReturns);
            
            // Ensure array lengths match for correlation
            const correlation = calculate_correlation(ucsReturns.slice(-assetReturns.length), assetReturns);
            
            return { asset: asset.name, volatility, correlation };
        } catch (error) {
            console.error(`Could not analyze risk for ${asset.name}:`, error);
            return null; // Return null on error for this specific asset
        }
    });

    const settledMetrics = await Promise.all(metricsPromises);
    const validMetrics = settledMetrics.filter(m => m !== null) as RiskAnalysisData['metrics'];
    
    return { metrics: validMetrics };
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

  const renderContent = () => {
        if (loading) {
             return (
                 <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                 </div>
            )
        }
        
        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (!riskData || riskData.metrics.length === 0) {
            return (
                 <Alert>
                    <AlertTitle>Dados Insuficientes para Análise</AlertTitle>
                    <AlertDescription>
                        A análise de risco não pode ser gerada. Isso pode ocorrer porque a fórmula do índice ainda não foi configurada ou não há dados históricos suficientes para os ativos.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
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
        );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Risco</CardTitle>
        <CardDescription>
            Análise de volatilidade e correlação dos ativos subjacentes em relação ao Índice UCS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
