
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
  Legend,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { AssetHistoricalTable } from './historical-price-table';
import { CalculatedAssetDetails } from './calculated-asset-details';
import { UcsAseDetails } from './ucs-ase-details';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PdfExportButton } from './pdf-export-button';

// --- TYPES ---
interface AssetDetailModalProps {
  asset: CommodityPriceData;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string; // Permite múltiplos ativos
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

// --- CONSTANTS ---
const CHART_DAYS = 90;
const TABLE_DAYS = 90;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const MULTI_LINE_ASSETS = ['ucs_ase', 'ucs', 'pdm'];

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
          {quote.ultimo && <DetailRow label="Preço (Último)" value={formatCurrency(quote.ultimo, 'BRL')} unit="BRL/saca" />}
          {quote.abertura && <DetailRow label="Abertura" value={formatCurrency(quote.abertura, 'BRL')} />}
          {quote.maxima && <DetailRow label="Máxima do Dia" value={formatCurrency(quote.maxima, 'BRL')} />}
          {quote.minima && <DetailRow label="Mínima do Dia" value={formatCurrency(quote.minima, 'BRL')} />}
          {quote.ton && <DetailRow label="Valor em Toneladas" value={formatCurrency(quote.ton, 'BRL')} unit="/ton" />}
          {quote.rent_media && <DetailRow label="Rentabilidade Média" value={formatCurrency(quote.rent_media, 'BRL')} unit="/ha" isHighlighted />}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export const SojaDetails = ({ quote }: { quote: FirestoreQuote }) => (
    <Card>
        <CardHeader>
            <CardTitle>Detalhes do Ativo: Soja</CardTitle>
            <CardDescription>Informações detalhadas da cotação para a data selecionada.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableBody>
                    {quote.ultimo != null && <DetailRow label="Preço (Último)" value={formatCurrency(quote.ultimo, 'USD')} unit="USD/saca" />}
                    {quote.ultimo_brl != null && <DetailRow label="Preço Convertido" value={formatCurrency(quote.ultimo_brl, 'BRL')} unit="BRL/saca" />}
                    {quote.cotacao_dolar != null && <DetailRow label="Cotação Dólar Usada" value={formatCurrency(quote.cotacao_dolar, 'BRL', 'usd')} />}
                    {quote.ton != null && <DetailRow label="Valor em Toneladas" value={formatCurrency(quote.ton, 'BRL')} unit="/ton" />}
                    {quote.rent_media != null && <DetailRow label="Rentabilidade Média" value={formatCurrency(quote.rent_media, 'BRL')} unit="/ha" isHighlighted />}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export const CarbonoDetails = ({ quote }: { quote: FirestoreQuote }) => (
  <Card>
    <CardHeader>
      <CardTitle>Detalhes do Ativo: Carbono</CardTitle>
      <CardDescription>Informações detalhadas da cotação para a data selecionada.</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          {quote.ultimo != null && <DetailRow label="Preço (Último)" value={formatCurrency(quote.ultimo, 'EUR')} unit="EUR/ton" />}
          {quote.ultimo_brl != null && <DetailRow label="Preço Convertido" value={formatCurrency(quote.ultimo_brl, 'BRL')} unit="BRL/ton" />}
          {quote.cotacao_euro != null && <DetailRow label="Cotação Euro Usada" value={formatCurrency(quote.cotacao_euro, 'BRL', 'eur')} />}
          {quote.abertura != null && <DetailRow label="Abertura" value={formatCurrency(quote.abertura, 'EUR')} />}
          {quote.maxima != null && <DetailRow label="Máxima do Dia" value={formatCurrency(quote.maxima, 'EUR')} />}
          {quote.minima != null && <DetailRow label="Mínima do Dia" value={formatCurrency(quote.minima, 'EUR')} />}
          {quote.rent_media != null && <DetailRow label="Rentabilidade Média" value={formatCurrency(quote.rent_media, 'BRL')} unit="/ha" isHighlighted />}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export const GenericAssetDetails = ({ quote, asset }: { quote: FirestoreQuote; asset: CommodityPriceData }) => {
    const details = [
        { label: 'Fechamento Anterior', value: quote.fechamento_anterior },
        { label: 'Abertura', value: quote.abertura },
        { label: 'Variação Diária', value: (quote.minima && quote.maxima) ? `${formatCurrency(quote.minima, asset.currency)} - ${formatCurrency(quote.maxima, asset.currency)}` : null },
        { label: 'Volume', value: quote.volume ? Number(quote.volume).toLocaleString('pt-BR') : null },
    ].filter(item => item.value != null);

    if (details.length === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground p-8 border rounded-lg bg-muted/50">
                Não há dados de mercado detalhados para este ativo.
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumo do Dia</CardTitle>
                <CardDescription>Dados de mercado para a data selecionada.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        {details.map(item => (
                            <DetailRow key={item.label} label={item.label} value={item.value} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export const AssetSpecificDetails = ({ asset, quote }: { asset: CommodityPriceData; quote: FirestoreQuote | null }) => {
  if (!quote) return null;

  switch (asset.id) {
    case 'milho':
      return <MilhoDetails quote={quote} />;
    case 'soja':
      return <SojaDetails quote={quote} />;
    case 'carbono':
      return <CarbonoDetails quote={quote} />;
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

const MultiLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm">{`${entry.name}: `}</span>
            <span className="text-sm font-mono font-semibold">
              {formatCurrency(entry.value, 'BRL', entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


/**
 * Componente do gráfico otimizado
 */
const PriceChart = memo<{
  data: ChartDataPoint[];
  asset: CommodityPriceData;
  isLoading: boolean;
}>(({ data, asset, isLoading }) => {

  const isMultiLine = useMemo(() => isUcsAseAsset(asset) && data.length > 0 && Object.keys(data[0]).length > 3, [asset, data]);

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

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Preços (Últimos {CHART_DAYS} Dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mr-2" />
            Nenhum dado histórico disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const lineColors: { [key: string]: string } = {
    ucs_ase: 'hsl(var(--chart-1))',
    ucs: 'hsl(var(--chart-2))',
    pdm: 'hsl(var(--chart-3))',
    value: 'hsl(var(--chart-1))', // Corrigido de 'price' para 'value'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isMultiLine
            ? 'Comparativo de Evolução de Índices'
            : `Histórico de Preços (Últimos ${CHART_DAYS} Dias)`
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
                content={isMultiLine ? <MultiLineTooltip /> : <DefaultTooltip asset={asset} />}
            />
             {isMultiLine && <Legend iconType="circle" />}

            {isMultiLine ? (
                Object.keys(lineColors)
                    .filter(key => key in data[0]) // Garante que a chave existe nos dados
                    .map(key => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key.toUpperCase()}
                            stroke={lineColors[key]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, stroke: lineColors[key], strokeWidth: 2 }}
                        />
                    ))
            ) : (
                <>
                    <ReferenceLine 
                    y={asset.price} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="2 2"
                    opacity={0.5}
                    />
                    <Line
                    type="monotone"
                    dataKey="value" // Corrigido de 'price' para 'value'
                    stroke={lineColors['value']}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: lineColors['value'], strokeWidth: 2 }}
                    />
                </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

PriceChart.displayName = 'PriceChart';

const DefaultTooltip = ({ active, payload, label, asset }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-semibold mb-2">{`Data: ${label}`}</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm">{`Preço: `}</span>
                    <span className="text-sm font-mono font-semibold">
                        {formatCurrency(payload[0].value, asset.currency, asset.id)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

// --- MAIN COMPONENT ---

export const AssetDetailModal = memo<AssetDetailModalProps>(({ 
  asset, 
  isOpen, 
  onOpenChange 
}) => {
  const [historicalData, setHistoricalData] = useState<Record<string, FirestoreQuote[]>>({});
  const [latestQuote, setLatestQuote] = useState<FirestoreQuote | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    retryCount: 0
  });

  const isCalculated = isCalculatedAsset(asset);
  const isMultiLineChart = isUcsAseAsset(asset);

  const fetchHistoricalData = useCallback(async (retryCount = 0) => {
    setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const assetsToFetch = isMultiLineChart ? MULTI_LINE_ASSETS : [asset.id];

    try {
      const allPromises = assetsToFetch.map(id => getCotacoesHistorico(id, TABLE_DAYS));
      const allHistory = await Promise.all(allPromises);

      const newHistoricalData: Record<string, FirestoreQuote[]> = {};
      allHistory.forEach((history, index) => {
        newHistoricalData[assetsToFetch[index]] = history;
      });

      const mainAssetHistory = newHistoricalData[asset.id] || [];
      const latest = mainAssetHistory.length > 0 ? mainAssetHistory[0] : null;

      setLatestQuote(latest);
      setHistoricalData(newHistoricalData);
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
  }, [asset.id, isMultiLineChart]);


  useEffect(() => {
    if (isOpen) {
      fetchHistoricalData();
    } else {
      setHistoricalData({});
      setLatestQuote(null);
      setLoadingState({ isLoading: true, error: null, retryCount: 0 });
    }
  }, [isOpen, fetchHistoricalData]);
  
  const chartData = useMemo((): ChartDataPoint[] => {
    if (Object.keys(historicalData).length === 0) return [];
  
    const thirtyDaysAgo = subDays(new Date(), CHART_DAYS);
  
    const processHistory = (history: FirestoreQuote[]) => {
      return history
        .map(quote => {
          const timestamp = parseTimestamp(quote.timestamp);
          if (!isAfter(timestamp, thirtyDaysAgo)) return null;
          return {
            timestamp: timestamp.getTime(),
            date: format(timestamp, 'dd/MM', { locale: ptBR }),
            value: extractPrice(quote),
          };
        })
        .filter((item): item is { timestamp: number; date: string; value: number } => item !== null && item.value > 0)
        .sort((a, b) => a.timestamp - b.timestamp);
    };
  
    if (!isMultiLineChart) {
      const singleAssetHistory = historicalData[asset.id] || [];
      return processHistory(singleAssetHistory);
    }
  
    const dataMap = new Map<string, ChartDataPoint>();
  
    MULTI_LINE_ASSETS.forEach(assetId => {
      const history = historicalData[assetId] || [];
      history.forEach(quote => {
        const timestamp = parseTimestamp(quote.timestamp);
        if (!isAfter(timestamp, thirtyDaysAgo)) return;
  
        const dateStr = format(timestamp, 'dd/MM');
        if (!dataMap.has(dateStr)) {
          dataMap.set(dateStr, { date: dateStr, timestamp: timestamp.getTime() });
        }
        
        const price = extractPrice(quote);
        if (price > 0) {
            const existingPoint = dataMap.get(dateStr)!;
            existingPoint[assetId] = price;
        }
      });
    });
  
    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  
  }, [historicalData, asset.id, isMultiLineChart]);
  

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
    
    if (isUcsAseAsset(asset)) {
      return (
        <div className="grid gap-6">
            <PriceChart data={chartData} asset={asset} isLoading={loadingState.isLoading} />
            <UcsAseDetails asset={asset} />
        </div>
      );
    }

    const specificDetails = AssetSpecificDetails({ asset, quote: latestQuote });

    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PriceChart data={chartData} asset={asset} isLoading={loadingState.isLoading} />
          {specificDetails ? specificDetails : (latestQuote && <GenericAssetDetails quote={latestQuote} asset={asset} />) }
        </div>
        
        <div className="space-y-6">
            {isCalculated && !isUcsAseAsset(asset) && !specificDetails && (
                <CalculatedAssetDetails asset={asset} />
            )}

            {!isCalculated && !specificDetails && (
                <AssetHistoricalTable
                    assetId={asset.id}
                    data={historicalData[asset.id] || []}
                    assetConfig={asset}
                    isLoading={loadingState.isLoading}
                    onRowClick={() => {}}
                />
            )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl w-full"
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
        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <PdfExportButton
              data={{
                mainIndex: asset,
                secondaryIndices: [],
                currencies: [],
                otherAssets: [],
                targetDate: new Date()
              }}
              reportType="asset-detail"
              fileName={`${asset.name}_${format(new Date(), 'yyyy-MM-dd')}`}
              variant="outline"
              size="sm"
            >
              Exportar PDF
            </PdfExportButton>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AssetDetailModal.displayName = 'AssetDetailModal';
