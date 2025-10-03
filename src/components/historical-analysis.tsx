
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import type { jsPDF as jsPDFWithAutoTableType } from 'jspdf-autotable';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Info, FileDown, Loader2, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetDetailModal } from './asset-detail-modal';
import { cn } from '@/lib/utils';

const ChartSkeleton = () => (
  <div className="h-72 w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

const TableSkeleton = () => (
    <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
);

type TimeRange = '7d' | '30d' | '90d';
const timeRangeToDays: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function DailyDetailsTable({ quote, asset }: { quote: FirestoreQuote | null, asset?: CommodityPriceData }) {
    if (!quote) return null;

    const details = [
        { label: 'Fechamento Anterior', value: quote.fechamento_anterior, type: 'currency' },
        { label: 'Abertura', value: quote.abertura, type: 'currency' },
        { label: 'Máxima do Dia', value: quote.maxima, type: 'currency' },
        { label: 'Mínima do Dia', value: quote.minima, type: 'currency' },
        { label: 'Volume', value: quote.volume, type: 'number' },
        { label: 'Variação (%)', value: quote.variacao_pct, type: 'percentage' },
        { label: 'Rentabilidade Média', value: quote.rent_media, type: 'currency' },
        { label: 'Valor em Toneladas', value: quote.ton, type: 'currency' },
    ].filter(item => item.value !== null && item.value !== undefined);

    const formatValue = (value: any, type: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (type === 'currency') return formatCurrency(value, asset?.currency || 'BRL');
        if (type === 'percentage') return `${Number(value).toFixed(2)}%`;
        if (type === 'number') return Number(value).toLocaleString('pt-BR');
        return String(value);
    };

    if (details.length === 0) {
        return <p className="text-sm text-muted-foreground text-center p-4">Nenhum detalhe adicional disponível para este dia.</p>;
    }

    const midPoint = Math.ceil(details.length / 2);
    const firstHalf = details.slice(0, midPoint);
    const secondHalf = details.slice(midPoint);

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <Table>
                <TableBody>
                    {firstHalf.map(item => (
                        <TableRow key={item.label}>
                            <TableCell className="font-medium text-muted-foreground">{item.label}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(item.value, item.type)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <Table>
                <TableBody>
                    {secondHalf.map(item => (
                        <TableRow key={item.label}>
                            <TableCell className="font-medium text-muted-foreground">{item.label}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(item.value, item.type)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function HistoricalAnalysis() {
  const [data, setData] = useState<FirestoreQuote[]>([]);
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<CommodityConfig | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCommodityConfigs().then(setAssets);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const days = timeRangeToDays[timeRange];
    
    getCotacoesHistorico(selectedAssetId, days)
      .then((history) => {
        setData(history);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, [timeRange, selectedAssetId]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const { chartData, latestQuote, mainAssetData } = useMemo(() => {
    const sortedData = [...data].sort((a, b) => {
        const dateA = typeof a.timestamp === 'number' ? a.timestamp : parseISO(a.timestamp as any).getTime();
        const dateB = typeof b.timestamp === 'number' ? b.timestamp : parseISO(b.timestamp as any).getTime();
        return dateA - dateB;
    });

    const chartPoints = sortedData
      .map((quote) => {
        const dateObject = typeof quote.timestamp === 'number' ? new Date(quote.timestamp) : parseISO(quote.timestamp as any);
        let dateFormat = timeRange === '90d' ? 'MMM' : 'dd/MM';
        return {
           date: format(dateObject, dateFormat, { locale: ptBR }),
           value: quote.valor ?? quote.ultimo,
        }
      });
      
    const latest = data.length > 0 ? data[0] : null;

    const mainAsset = selectedAssetConfig && latest ? {
        ...selectedAssetConfig,
        price: latest.valor ?? latest.ultimo,
        change: latest.variacao_pct ?? 0,
        absoluteChange: (latest.valor ?? latest.ultimo) - (latest.fechamento_anterior ?? (latest.valor ?? latest.ultimo)),
        lastUpdated: latest.data,
    } : null;

    return { chartData: chartPoints, latestQuote: latest, mainAssetData: mainAsset };
  }, [data, timeRange, selectedAssetConfig]);
  
  const handleExportPdf = async () => {
    if (!selectedAssetConfig || !chartRef.current || !latestQuote || !mainAssetData) return;
    setIsExporting(true);

    try {
        const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const doc = new jsPDF() as jsPDFWithAutoTableType;
        const timeRangeText = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' }[timeRange];
        const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        const changeColor = mainAssetData.change >= 0 ? [39, 174, 96] : [192, 57, 43];

        // --- CABEÇALHO DO DOCUMENTO ---
        doc.setFontSize(18);
        doc.setTextColor(34, 47, 62);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedAssetConfig.name} (${selectedAssetConfig.id.toUpperCase()})`, 14, 22);

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(mainAssetData.price, mainAssetData.currency, mainAssetData.id), 14, 32);

        doc.setFontSize(12);
        doc.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
        doc.text(
            `${mainAssetData.absoluteChange >= 0 ? '+' : ''}${formatCurrency(mainAssetData.absoluteChange, mainAssetData.currency, mainAssetData.id)} (${mainAssetData.change >= 0 ? '+' : ''}${mainAssetData.change.toFixed(2)}%)`, 
            14, 
            40
        );

        doc.setFontSize(9);
        doc.setTextColor(108, 122, 137);
        doc.text(`Dados de ${latestQuote.data} | Fonte: Investing.com`, 14, 45);


        // --- IMAGEM DO GRÁFICO ---
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 28;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 14, 55, imgWidth, imgHeight);

        let finalY = 55 + imgHeight + 10;
        
        // --- TABELA DE DETALHES DO DIA ---
        const detailsToExport = [
            { label: 'Fechamento Anterior', value: latestQuote.fechamento_anterior },
            { label: 'Abertura', value: latestQuote.abertura },
            { label: 'Variação Diária', value: `${formatCurrency(latestQuote.minima, mainAssetData.currency)} - ${formatCurrency(latestQuote.maxima, mainAssetData.currency)}` },
            { label: 'Volume', value: latestQuote.volume?.toLocaleString('pt-BR') },
            { label: 'Rentabilidade Média', value: formatCurrency(latestQuote.rent_media, 'BRL') },
            { label: 'Valor (tonelada)', value: formatCurrency(latestQuote.ton, 'BRL') },
        ].filter(item => item.value !== null && item.value !== undefined && item.value !== 'N/A');

        if (detailsToExport.length > 0) {
            const tableBody = detailsToExport.map(item => [item.label, item.value]);
            const half = Math.ceil(tableBody.length / 2);
            const firstHalf = tableBody.slice(0, half);
            const secondHalf = tableBody.slice(half);

            doc.autoTable({
                startY: finalY,
                body: firstHalf,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
            });

             doc.autoTable({
                startY: finalY,
                body: secondHalf,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
                margin: { left: doc.internal.pageSize.getWidth() / 2 + 5 },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }


        // Seção Específica para UCS ASE
        if (selectedAssetConfig.id === 'ucs_ase' && latestQuote.componentes) {
            doc.autoTable({
                startY: finalY,
                head: [['Composição do Valor Final (BRL)', '']],
                body: [
                    ['UCS Original', formatCurrency(latestQuote.valores_originais?.ucs || 0, 'BRL', 'ucs')],
                    ['Fórmula Aplicada', latestQuote.formula || 'UCS × 2'],
                    ['Resultado Final', formatCurrency(latestQuote.componentes.resultado_final_brl || 0, 'BRL', 'ucs_ase')]
                ],
                theme: 'grid',
                headStyles: { fillColor: [34, 47, 62] },
            });
            finalY = (doc as any).lastAutoTable.finalY;

            doc.autoTable({
                startY: finalY,
                head: [['Conversão para USD', '']],
                body: [
                  ['Cotação USD/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_usd || 0, 'BRL', 'usd')],
                  ['Valor Final (USD)', formatCurrency(latestQuote.componentes.resultado_final_usd || 0, 'USD', 'ucs_ase')],
                ],
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96] }, // Verde
            });

             doc.autoTable({
                startY: finalY,
                head: [['Conversão para EUR', '']],
                body: [
                   ['Cotação EUR/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_eur || 0, 'BRL', 'eur')],
                   ['Valor Final (EUR)', formatCurrency(latestQuote.componentes.resultado_final_eur || 0, 'EUR', 'ucs_ase')],
                ],
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] }, // Azul
                margin: { left: doc.internal.pageSize.getWidth() / 2 + 5 },
            });
        }
        
        doc.save(`relatorio_${selectedAssetConfig.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
        console.error("PDF generation error:", error);
    } finally {
        setIsExporting(false);
    }
  };


  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b">
        <div className="flex-1">
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecione um ativo" />
            </SelectTrigger>
            <SelectContent>
              {assets.map(asset => (
                <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Tabs 
            defaultValue={timeRange} 
            className="w-full sm:w-auto" 
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportPdf}
            disabled={isLoading || isExporting || data.length === 0}
            title="Exportar para PDF"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 p-4">
        <div ref={chartRef} className="h-72 w-full bg-background pt-4 pr-4" style={{ marginLeft: '-10px' }}>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => formatCurrency(value as number, selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value), selectedAssetConfig?.currency || 'BRL', selectedAssetConfig?.id), ' ']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name=" "
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Dados Históricos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Detalhes do Dia ({latestQuote?.data || 'N/A'})</h3>
            <div className="flex items-start gap-2 p-3 mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>A tabela abaixo mostra os dados detalhados para o dia mais recente do período selecionado.</p>
            </div>
            {isLoading ? <TableSkeleton /> : <DailyDetailsTable quote={latestQuote} asset={mainAssetData!} />}
          </TabsContent>
          <TabsContent value="history" className="pt-4">
             <HistoricalPriceTable 
                asset={selectedAssetConfig!}
                historicalData={data} 
                isLoading={isLoading} 
                onRowClick={(assetId) => {
                    const asset = assets.find(a => a.id === assetId);
                    if (asset && mainAssetData) {
                        const fullAssetData = {
                            ...asset,
                            price: mainAssetData.price,
                            change: mainAssetData.change,
                            absoluteChange: mainAssetData.absoluteChange,
                            lastUpdated: mainAssetData.lastUpdated,
                        };
                        setSelectedAssetForModal(fullAssetData);
                    }
                }}
              />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    {selectedAssetForModal && (
        <AssetDetailModal
            asset={selectedAssetForModal as any}
            isOpen={!!selectedAssetForModal}
            onOpenChange={() => setSelectedAssetForModal(null)}
        />
    )}
    </>
  );
}
