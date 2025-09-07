
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RiskAnalysisData, FirestoreQuote } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { getCommodities } from '@/lib/commodity-config-service';
import { getUcsIndexValue, getCotacoesHistorico } from '@/lib/data-service';
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
    
    // Calculate returns for the index. Filter out zero values to avoid division by zero.
    const ucsPrices = ucsHistoryData.history.map(d => d.value).filter(v => v > 0);
    if (ucsPrices.length < 2) return { metrics: [] };

    const ucsReturns = ucsPrices.slice(1).map((v, i) => (ucsPrices[i] === 0 ? 0 : (v / ucsPrices[i]) -1));
    
    const metricsPromises = commodities.map(async (asset) => {
        try {
            // Get historical data from our Firestore historical collection
            const assetHistory: FirestoreQuote[] = await getCotacoesHistorico(asset.name, 30);
            if (assetHistory.length < 2) return null;

            // Sort by date ascending to calculate returns correctly
            const sortedHistory = assetHistory.sort((a,b) => a.timestamp.toDate() - b.timestamp.toDate());
            
            const assetPrices = sortedHistory.map(d => d.ultimo).filter(v => v > 0);
            if (assetPrices.length < 2) return null;
            
            const assetReturns = assetPrices.slice(1).map((v, i) => (assetPrices[i] === 0 ? 0 : (v / assetPrices[i]) - 1));
            
            if (assetReturns.length < 2) return null;
            
            const volatility = calculate_volatility(assetReturns);
            
            // Ensure array lengths match for correlation by taking the minimum length
            const minLength = Math.min(ucsReturns.length, assetReturns.length);
            const correlation = calculate_correlation(ucsReturns.slice(-minLength), assetReturns.slice(-minLength));
            
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
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
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
