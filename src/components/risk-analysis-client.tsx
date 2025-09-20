
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { HelpCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getIconForCategory } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface RiskAnalysisClientProps {
    assets: CommodityPriceData[];
    ucsAseHistory: FirestoreQuote[];
    assetHistories: Record<string, FirestoreQuote[]>;
}

interface RiskData {
    id: string;
    name: string;
    volatility: number;
    correlation: number;
}

// --- Funções de Cálculo (movidas para o cliente) ---

function calculateDailyChanges(history: FirestoreQuote[]): number[] {
    if (history.length < 2) return [];
    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const changes: number[] = [];
    for (let i = 1; i < sortedHistory.length; i++) {
        const prev = sortedHistory[i - 1].ultimo;
        const current = sortedHistory[i].ultimo;
        if (prev > 0) {
            changes.push((current - prev) / prev);
        }
    }
    return changes;
}

function calculateVolatility(changes: number[]): number {
    if (changes.length === 0) return 0;
    const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
    return Math.sqrt(variance) * 100; // Retorna como porcentagem
}

function calculateCorrelation(changesA: number[], changesB: number[]): number {
    const n = Math.min(changesA.length, changesB.length);
    if (n === 0) return 0;

    const slicedA = changesA.slice(-n);
    const slicedB = changesB.slice(-n);

    const meanA = slicedA.reduce((sum, val) => sum + val, 0) / n;
    const meanB = slicedB.reduce((sum, val) => sum + val, 0) / n;

    let cov = 0;
    let stdDevA = 0;
    let stdDevB = 0;

    for (let i = 0; i < n; i++) {
        const devA = slicedA[i] - meanA;
        const devB = slicedB[i] - meanB;
        cov += devA * devB;
        stdDevA += Math.pow(devA, 2);
        stdDevB += Math.pow(devB, 2);
    }

    const denominator = Math.sqrt(stdDevA) * Math.sqrt(stdDevB);
    return denominator === 0 ? 0 : cov / denominator;
}

export function RiskAnalysisClient({ assets, ucsAseHistory, assetHistories }: RiskAnalysisClientProps) {
    const [loading, setLoading] = useState(false);

    const riskData = useMemo<RiskData[]>(() => {
        setLoading(true);
        const ucsAseChanges = calculateDailyChanges(ucsAseHistory);
        const analyzableAssets = assets.filter(a => !a.isCalculated && a.id !== 'usd' && a.id !== 'eur');

        const data = analyzableAssets.map(asset => {
            const assetHistory = assetHistories[asset.id] || [];
            const assetChanges = calculateDailyChanges(assetHistory);
            
            const volatility = calculateVolatility(assetChanges);
            const correlation = calculateCorrelation(assetChanges, ucsAseChanges);

            return { id: asset.id, name: asset.name, volatility, correlation };
        });
        setLoading(false);
        return data;
    }, [assets, ucsAseHistory, assetHistories]);

    const maxVolatility = Math.max(...riskData.map(d => d.volatility), 0);

    const renderTableContent = () => {
        if (loading) {
            return Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
            ));
        }

        if (riskData.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        Não há dados suficientes para a análise de risco.
                    </TableCell>
                </TableRow>
            );
        }

        return riskData.sort((a, b) => b.correlation - a.correlation).map(data => {
            const Icon = getIconForCategory(assets.find(a => a.id === data.id));
            const correlationColor = data.correlation > 0.3 ? 'text-primary' : data.correlation < -0.3 ? 'text-destructive' : 'text-muted-foreground';
            const volatilityColor = data.volatility > (maxVolatility * 0.66) ? 'bg-destructive' : data.volatility > (maxVolatility * 0.33) ? 'bg-amber-500' : 'bg-primary';
            const CorrelationIcon = data.correlation > 0 ? TrendingUp : TrendingDown;

            return (
                <TableRow key={data.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{data.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Progress value={(data.volatility / maxVolatility) * 100} indicatorClassName={volatilityColor} className="h-2" />
                                        <span className="font-mono text-sm">{data.volatility.toFixed(2)}%</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Volatilidade: {data.volatility.toFixed(2)}%</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </TableCell>
                    <TableCell>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("flex items-center justify-end gap-2 font-mono text-sm", correlationColor)}>
                                        <CorrelationIcon className={cn("h-4 w-4", data.correlation === 0 && "hidden")} />
                                        <span>{data.correlation.toFixed(3)}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Correlação com Índice UCS ASE: {data.correlation.toFixed(3)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </TableCell>
                </TableRow>
            );
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Matriz de Risco dos Ativos</CardTitle>
                <CardDescription>
                    Análise da volatilidade de cada ativo e sua correlação com o índice principal (UCS ASE) nos últimos 365 dias.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ativo</TableHead>
                            <TableHead>
                                <div className="flex items-center gap-1">
                                    Volatilidade
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent><p>Mede a intensidade da variação de preço de um ativo.<br/>Valores mais altos indicam maior instabilidade.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </TableHead>
                            <TableHead className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    Correlação
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                                            <TooltipContent><p>Indica como o preço do ativo se move em relação ao Índice UCS ASE.<br/>+1: Movem-se juntos. -1: Movem-se em oposição.</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableContent()}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
