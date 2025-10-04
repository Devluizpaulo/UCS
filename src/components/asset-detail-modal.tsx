
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ArrowDown, ArrowUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { format, parseISO, subDays, isAfter, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { AssetIcon } from '@/lib/icons';
import { getCotacoesHistorico, getQuoteByDate } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { HistoricalPriceTable } from './historical-price-table';
import { CalculatedAssetDetails } from './calculated-asset-details';
import { UcsAseDetails } from './ucs-ase-details';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- TYPES ---
interface AssetDetailModalProps {
  asset: CommodityPriceData;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface ChartDataPoint {
  date: string;
  price: number;
  timestamp: number;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

// --- CONSTANTS ---
const CHART_DAYS = 30;
const TABLE_DAYS = 90;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// --- UTILITY FUNCTIONS ---

/**
 * Extrai preço de uma cotação com fallback inteligente
 */
function extractPrice(quote: FirestoreQuote): number {
  return quote.valor ?? quote.ultimo ?? quote.resultado_final_brl ?? 0;
}

/**
 * Converte timestamp para Date de forma segura
 */
function parseTimestamp(timestamp: any): Date {
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'string') {
    const parsed = parseISO(timestamp);
    return isValid(parsed) ? parsed : new Date();
  }
  if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
  }
  return new Date();
}

/**
 * Determina se um ativo é calculado
 */
function isCalculatedAsset(asset: CommodityPriceData): boolean {
  return ['index', 'sub-index', 'vus', 'vmad', 'crs', 'calculated'].includes(asset.category);
}

/**
 * Determina se é o UCS ASE
 */
function isUcsAseAsset(asset: CommodityPriceData): boolean {
  return asset.id === 'ucs_ase';
}

// --- SUB-COMPONENTS ---

const DetailRow = ({ label, value, unit, isHighlighted }: { label: string; value: React.ReactNode; unit?: string; isHighlighted?: boolean }) => (
  <TableRow className={cn(isHighlighted && "bg-primary/5")}>
    <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
    <TableCell className="text-right font-mono">
      {value} {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
    </TableCell>
  </TableRow>
);


const MilhoDetails = ({ quote }: { quote: FirestoreQuote }) => (
  <Card>
    <CardHeader>
      <CardTitle>Detalhes do Ativo: Milho</CardTitle>
      <CardDescription>Informações detalhadas da cotação para a data selecionada.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          <DetailRow label="Preço (Último)" value={formatCurrency(quote.ultimo, 'BRL')} unit="BRL/saca" />
          <DetailRow label="Abertura" value={formatCurrency(quote.abertura, 'BRL')} />
          <DetailRow label="Máxima do Dia" value={formatCurrency(quote.maxima, 'BRL')} />
          <DetailRow label="Mínima do Dia" value={formatCurrency(quote.minima, 'BRL')} />
          <DetailRow label="Valor em Toneladas" value={formatCurrency(quote.ton, 'BRL')} unit="/ton" />
          <DetailRow label="Rentabilidade Média" value={formatCurrency(quote.rent_media, 'BRL')} unit="/ha" isHighlighted />
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const SojaDetails = ({ quote }: { quote: FirestoreQuote }) => (
    <Card>
        <CardHeader>
            <CardTitle>Detalhes do Ativo: Soja</CardTitle>
            <CardDescription>Informações detalhadas da cotação para a data selecionada.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableBody>
                    <DetailRow label="Preço (Último)" value={formatCurrency(quote.ultimo, 'USD')} unit="USD/saca" />
                    <DetailRow label="Preço Convertido" value={formatCurrency(quote.ultimo_brl, 'BRL')} unit="BRL/saca" />
                    <DetailRow label="Cotação Dólar Usada" value={formatCurrency(quote.cotacao_dolar, 'BRL')} />
                    <DetailRow label="Valor em Toneladas" value={formatCurrency(quote.ton, 'BRL')} unit="/ton" />
                    <DetailRow label="Rentabilidade Média" value={formatCurrency(quote.rent_media, 'BRL')} unit="/ha" isHighlighted />
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export const AssetSpecificDetails = ({ asset, quote }: { asset: CommodityPriceData; quote: FirestoreQuote | null }) => {
  if (!quote) return null;

  switch (asset.id) {
    case 'milho':
      return <MilhoDetails quote={quote} />;
    case 'soja':
      return <SojaDetails quote={quote} />;
    default:
      return null;
  }
};


/**
 * Componente de loading otimizado
 */
const LoadingSpinner = memo<{ size?: number; className?: string }>(({ 
  size = 8, 
  className 
}) => (
  <div className={cn("flex items-center justify-center", className)}>
    <Loader2 className={cn("animate-spin text-primary", `h-${size} w-${size}`)} />
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Componente de erro com retry
 */
const ErrorState = memo<{
  error: string;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}>(({ error, onRetry, retryCount, maxRetries }) => (
  <Alert variant="destructive" className="m-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      {retryCount < maxRetries && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Tentar Novamente
        </Button>
      )}
    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

/**
 * Componente de informações do ativo
 */
export const AssetInfo = memo<{
  asset: CommodityPriceData;
}>(({ asset }) => {
  const changeColor = asset.change >= 0 ? 'text-emerald-600' : 'text-red-600';
  const ChangeIcon = asset.change >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-6">
      {/* Bloco de Preço Principal */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{asset.unit || 'Pontos'}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-mono">
            {formatCurrency(asset.price, asset.currency, asset.id)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn('flex items-center text-sm font-semibold', changeColor)}>
            <ChangeIcon className="h-4 w-4 mr-1" />
            <span>{typeof asset.change === 'number' ? `${asset.change.toFixed(2)}%` : 'N/A'}</span>
            <span className="mx-1">/</span>
            <span>{formatCurrency(asset.absoluteChange, asset.currency, asset.id)}</span>
            <span className="text-xs text-muted-foreground ml-1">(24h)</span>
          </div>
        </div>
      </div>
      
      {/* Separador e Bloco de Informações Adicionais */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Categoria</p>
            <Badge variant="secondary" className="capitalize">{asset.category}</Badge>
          </div>
          
          {isCalculatedAsset(asset) && (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Tipo</p>
              <Badge variant="outline">Índice Calculado</Badge>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Moeda</p>
            <p className="font-mono">{asset.currency}</p>
          </div>

          {asset.lastUpdated && asset.lastUpdated !== 'N/A' && (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Atualização</p>
              <p className="font-mono text-xs">{asset.lastUpdated}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AssetInfo.displayName = 'AssetInfo';

/**
 * Componente do gráfico otimizado
 */
const PriceChart = memo<{
  data: ChartDataPoint[];
  asset: CommodityPriceData;
  isLoading: boolean;
}>(({ data, asset, isLoading }) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const currentPrice = asset.price;
    return data.map(point => ({
      ...point,
      currentPrice
    }));
  }, [data, asset.price]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Preços (Últimos {CHART_DAYS} Dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <LoadingSpinner className="h-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Preços (Últimos {CHART_DAYS} Dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mr-2" />
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Preços (Últimos {CHART_DAYS} Dias)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value as number, asset.currency, asset.id)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: any) => [
                formatCurrency(Number(value), asset.currency, asset.id), 
                'Preço'
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <ReferenceLine 
              y={asset.price} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

PriceChart.displayName = 'PriceChart';

// --- MAIN COMPONENT ---

export const AssetDetailModal = memo<AssetDetailModalProps>(({ 
  asset, 
  isOpen, 
  onOpenChange 
}) => {
  const [historicalData, setHistoricalData] = useState<FirestoreQuote[]>([]);
  const [latestQuote, setLatestQuote] = useState<FirestoreQuote | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    retryCount: 0
  });

  const isCalculated = isCalculatedAsset(asset);
  const isUcsAse = isUcsAseAsset(asset);

  const fetchHistoricalData = useCallback(async (retryCount = 0) => {
    setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [latest, history] = await Promise.all([
        getQuoteByDate(asset.id, new Date()),
        isUcsAse ? Promise.resolve([]) : getCotacoesHistorico(asset.id, TABLE_DAYS)
      ]);
      setLatestQuote(latest);
      setHistoricalData(history);
      setLoadingState({ isLoading: false, error: null, retryCount: 0 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados históricos';
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          fetchHistoricalData(retryCount + 1);
        }, RETRY_DELAY * (retryCount + 1));
      }
      
      setLoadingState({
        isLoading: false,
        error: errorMessage,
        retryCount
      });
    }
  }, [asset.id, isUcsAse]);

  useEffect(() => {
    if (isOpen) {
      fetchHistoricalData();
    } else {
      setHistoricalData([]);
      setLatestQuote(null);
      setLoadingState({ isLoading: true, error: null, retryCount: 0 });
    }
  }, [isOpen, fetchHistoricalData]);

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!historicalData.length) return [];

    const thirtyDaysAgo = subDays(new Date(), CHART_DAYS);
    
    return historicalData
      .filter(quote => {
        const quoteDate = parseTimestamp(quote.timestamp);
        return isAfter(quoteDate, thirtyDaysAgo);
      })
      .map((quote) => {
        const dateObject = parseTimestamp(quote.timestamp);
        return {
          date: format(dateObject, 'dd/MM', { locale: ptBR }),
          price: extractPrice(quote),
          timestamp: dateObject.getTime()
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [historicalData]);

  const handleRetry = useCallback(() => {
    fetchHistoricalData(0);
  }, [fetchHistoricalData]);

  const renderContent = () => {
    if (loadingState.isLoading && !latestQuote) {
        return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (loadingState.error) {
       return (
        <ErrorState
            error={loadingState.error}
            onRetry={handleRetry}
            retryCount={loadingState.retryCount}
            maxRetries={MAX_RETRY_ATTEMPTS}
        />
       );
    }
    
    if (isUcsAse) {
      return <UcsAseDetails asset={asset} />;
    }

    return (
      <div className="grid gap-6">
        <PriceChart data={chartData} asset={asset} isLoading={loadingState.isLoading} />
        <AssetSpecificDetails asset={asset} quote={latestQuote} />
        {isCalculated && !isUcsAse ? (
            <CalculatedAssetDetails asset={asset} />
        ) : (
            !AssetSpecificDetails({ asset, quote: latestQuote }) &&
            <HistoricalPriceTable 
              asset={asset}
              historicalData={historicalData} 
              isLoading={loadingState.isLoading} 
            />
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full"
        aria-describedby="asset-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted border">
              <AssetIcon asset={asset} className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{asset.name}</DialogTitle>
              <DialogDescription id="asset-description" className="text-base">
                {asset.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
            <div className="space-y-6">
                <AssetInfo asset={asset} />
                {renderContent()}
            </div>
        </DialogBody>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
});

AssetDetailModal.displayName = 'AssetDetailModal';

    
