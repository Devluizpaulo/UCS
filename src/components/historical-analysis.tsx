

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
  ReferenceLine,
} from 'recharts';
import { format, parseISO, isAfter, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import type { jsPDF as jsPDFWithAutoTableType } from 'jspdf-autotable';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import type { FirestoreQuote, CommodityConfig, CommodityPriceData } from '@/lib/types';
import { getCotacoesHistorico, getCommodityConfigs, getQuoteByDate } from '@/lib/data-service';
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
import { Info, FileDown, Loader2 } from 'lucide-react';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetDetailModal, AssetInfo, AssetSpecificDetails } from './asset-detail-modal';
import { UcsAseDetails } from './ucs-ase-details';
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

export function HistoricalAnalysis({ targetDate }: { targetDate: Date }) {
  const [data, setData] = useState<FirestoreQuote[]>([]);
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ucs_ase');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<CommodityConfig | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCommodityConfigs().then(setAssets);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Always fetch 90 days for the graph context
    getCotacoesHistorico(selectedAssetId, 90)
      .then((history) => {
        setData(history);
        setIsLoading(false);
      })
      .catch(() => {
        setData([]);
        setIsLoading(false);
      });
  }, [selectedAssetId, targetDate]);

  const selectedAssetConfig = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const { chartData, latestQuote, mainAssetData } = useMemo(() => {
    if (data.length === 0 || !selectedAssetConfig) {
        return { chartData: [], latestQuote: null, mainAssetData: null };
    }

    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.timestamp as any).getTime();
        const dateB = new Date(b.timestamp as any).getTime();
        return dateB - dateA; // Mais recente primeiro
    });

    const quoteForDate = sortedData.find(q => {
        const quoteDate = new Date(q.timestamp as any);
        return format(quoteDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
    }) || sortedData[0];
    
    if (!quoteForDate) {
       return { chartData: [], latestQuote: null, mainAssetData: null };
    }

    const chartPoints = sortedData
      .map((quote) => {
        const dateObject = new Date(quote.timestamp as any);
        let dateFormat = 'dd/MM';
        return {
           date: format(dateObject, dateFormat, { locale: ptBR }),
           value: quote.valor_brl ?? quote.resultado_final_brl ?? quote.ultimo ?? quote.valor,
        }
      }).reverse(); // Reverte para ordem cronológica no gráfico
      
    // Lógica corrigida para selecionar o preço e moeda corretos
    let priceForAssetInfo = quoteForDate.valor_brl ?? quoteForDate.resultado_final_brl ?? quoteForDate.valor ?? quoteForDate.ultimo ?? 0;
    let currencyForAssetInfo = selectedAssetConfig.currency;

    if (selectedAssetConfig.id === 'soja') {
        priceForAssetInfo = quoteForDate.ultimo ?? 0; // Preço original em USD
        currencyForAssetInfo = 'USD';
    } else if (selectedAssetConfig.currency === 'BRL') {
        priceForAssetInfo = quoteForDate.ultimo_brl ?? priceForAssetInfo;
    }

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: priceForAssetInfo,
        currency: currencyForAssetInfo,
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (quoteForDate.valor ?? quoteForDate.ultimo ?? 0) - (quoteForDate.fechamento_anterior ?? (quoteForDate.valor ?? quoteForDate.ultimo ?? 0)),
        lastUpdated: quoteForDate.data || format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy'),
    };

    return { chartData: chartPoints, latestQuote: quoteForDate, mainAssetData: mainAsset };
  }, [data, targetDate, selectedAssetConfig]);
  
  const handleExportPdf = async () => {
    if (!selectedAssetConfig || !chartRef.current || !latestQuote || !mainAssetData) return;
    setIsExporting(true);

    try {
        const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const doc = new jsPDF() as jsPDFWithAutoTableType;
        const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        const changeColor = mainAssetData.change >= 0 ? [39, 174, 96] : [192, 57, 43];

        // --- CABEÇALHO DO DOCUMENTO ---
        doc.setFontSize(18);
        doc.setTextColor(34, 47, 62); // Cor escura (quase preto)
        doc.setFont('helvetica', 'bold');
        doc.text(`Relatório de Ativo: ${selectedAssetConfig.name}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(108, 122, 137); // Cinza
        doc.text(`Análise para ${format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} | Gerado em: ${generationDate}`, doc.internal.pageSize.getWidth() / 2, 29, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.line(14, 35, doc.internal.pageSize.getWidth() - 14, 35);


        // --- RESUMO DO PREÇO ---
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(mainAssetData.price, mainAssetData.currency, mainAssetData.id), 14, 48);

        doc.setFontSize(12);
        doc.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
        doc.text(
            `${mainAssetData.absoluteChange >= 0 ? '▲' : '▼'} ${formatCurrency(mainAssetData.absoluteChange, mainAssetData.currency, mainAssetData.id)} (${mainAssetData.change >= 0 ? '+' : ''}${mainAssetData.change.toFixed(2)}%)`, 
            14, 
            56
        );

        doc.setFontSize(9);
        doc.setTextColor(108, 122, 137);
        doc.text(`Dados de ${latestQuote.data} | Fonte: Investing.com`, 14, 62);


        // --- IMAGEM DO GRÁFICO ---
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 28;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 14, 70, imgWidth, imgHeight);

        let finalY = 70 + imgHeight + 10;
        
        // --- TABELA DE DETALHES DO DIA ---
        const detailsToExport = [
            { label: 'Fechamento Anterior', value: formatCurrency(latestQuote.fechamento_anterior, mainAssetData.currency) },
            { label: 'Abertura', value: formatCurrency(latestQuote.abertura, mainAssetData.currency) },
            { label: 'Var. Diária', value: `${formatCurrency(latestQuote.minima, mainAssetData.currency)} - ${formatCurrency(latestQuote.maxima, mainAssetData.currency)}` },
            { label: 'Volume', value: latestQuote.volume?.toLocaleString('pt-BR') || 'N/A' },
        ].filter(item => item.value !== null && item.value !== undefined && !item.value.includes('NaN'));

        // Adiciona campos específicos do ativo (ex: rent_media)
        if (latestQuote.rent_media) {
          detailsToExport.push({ label: 'Rentabilidade Média', value: formatCurrency(latestQuote.rent_media, 'BRL') });
        }
        if (latestQuote.ton) {
          detailsToExport.push({ label: 'Valor (tonelada)', value: formatCurrency(latestQuote.ton, 'BRL') });
        }


        if (detailsToExport.length > 0 && selectedAssetConfig.id !== 'ucs_ase') {
            doc.autoTable({
                startY: finalY,
                head: [['Resumo do Dia', 'Valor']],
                body: detailsToExport.map(item => [item.label, item.value]),
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80] },
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
            finalY = (doc as any).lastAutoTable.finalY + 5;

            doc.autoTable({
                startY: finalY,
                head: [['Conversão para USD', '']],
                body: [
                  ['Cotação USD/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_usd || 0, 'BRL', 'usd')],
                  ['Valor Final (USD)', formatCurrency(latestQuote.componentes.resultado_final_usd || 0, 'USD', 'ucs_ase')],
                  ['Fórmula', latestQuote.conversoes?.brl_para_usd || 'N/A'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96] }, // Verde
                tableWidth: (pdfWidth / 2) - 20,
                margin: { left: 14 }
            });

             doc.autoTable({
                startY: finalY,
                head: [['Conversão para EUR', '']],
                body: [
                   ['Cotação EUR/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_eur || 0, 'BRL', 'eur')],
                   ['Valor Final (EUR)', formatCurrency(latestQuote.componentes.resultado_final_eur || 0, 'EUR', 'ucs_ase')],
                   ['Fórmula', latestQuote.conversoes?.brl_para_eur || 'N/A'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] }, // Azul
                tableWidth: (pdfWidth / 2) - 20,
                margin: { left: doc.internal.pageSize.getWidth() / 2 + 6 },
            });
            finalY = (doc as any).lastAutoTable.finalY;
        }

        // --- Rodapé ---
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(
                `Página ${i} de ${pageCount} | Monitor do Índice UCS`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
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
        {mainAssetData ? <AssetInfo asset={mainAssetData} /> : <Skeleton className="h-24 w-full" />}

        <div ref={chartRef} className="h-72 w-full bg-background pt-4 pr-4" style={{ marginLeft: '-10px' }}>
          {isLoading ? (
            <ChartSkeleton />
          ) : chartData.length > 0 ? (
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
                <ReferenceLine 
                    y={mainAssetData?.price} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="2 2"
                    opacity={0.5}
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
          ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Sem dados históricos para exibir o gráfico.</p>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Dados Históricos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Detalhes do Dia ({latestQuote?.data || format(targetDate, 'dd/MM/yyyy')})</h3>
            <div className="flex items-start gap-2 p-3 mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>A seção abaixo mostra os dados detalhados para o dia mais recente do período selecionado, específicos para o ativo analisado.</p>
            </div>
            {isLoading ? (
              <TableSkeleton />
            ) : mainAssetData && latestQuote ? (
              mainAssetData.id === 'ucs_ase' ? (
                <UcsAseDetails asset={mainAssetData} />
              ) : (
                <AssetSpecificDetails asset={mainAssetData} quote={latestQuote} />
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">Nenhum detalhe adicional disponível para este dia.</p>
            )}
          </TabsContent>
          <TabsContent value="history" className="pt-4">
             <HistoricalPriceTable 
                asset={mainAssetData!}
                historicalData={data} 
                isLoading={isLoading} 
                onRowClick={(assetId) => {
                    const asset = assets.find(a => a.id === assetId);
                    if (asset && mainAssetData) {
                        const fullAssetData: CommodityPriceData = {
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
            asset={selectedAssetForModal as CommodityPriceData}
            isOpen={!!selectedAssetForModal}
            onOpenChange={() => setSelectedAssetForModal(null)}
        />
    )}
    </>
  );
}
