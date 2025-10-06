
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
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
import { Button } from './ui/button';
import { Info, FileDown, Loader2 } from 'lucide-react';
import { HistoricalPriceTable } from './historical-price-table';
import { AssetInfo, AssetSpecificDetails, GenericAssetDetails } from './asset-detail-modal';
import { UcsAseDetails } from './ucs-ase-details';
import { cn } from '@/lib/utils';
import { LogoUCS } from './logo-bvm';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTableType extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTableType;
}

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
  }, [selectedAssetId]);

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
           value: quote.ultimo ?? quote.valor,
        }
      }).reverse(); // Reverte para ordem cronológica no gráfico
      
    const isForexAsset = ['soja', 'carbono', 'madeira'].includes(selectedAssetConfig.id);

    const mainAsset: CommodityPriceData = {
        ...selectedAssetConfig,
        price: isForexAsset ? (quoteForDate.ultimo ?? 0) : (quoteForDate.valor_brl ?? quoteForDate.valor ?? quoteForDate.ultimo ?? 0),
        currency: isForexAsset ? selectedAssetConfig.currency : 'BRL',
        change: quoteForDate.variacao_pct ?? 0,
        absoluteChange: (quoteForDate.ultimo ?? 0) - (quoteForDate.fechamento_anterior ?? (quoteForDate.ultimo ?? 0)),
        lastUpdated: quoteForDate.data || format(new Date(quoteForDate.timestamp as any), 'dd/MM/yyyy'),
    };

    return { chartData: chartPoints, latestQuote: quoteForDate, mainAssetData: mainAsset };
  }, [data, targetDate, selectedAssetConfig]);
  
  const handleExportPdf = async () => {
    if (!selectedAssetConfig || !chartRef.current || !latestQuote || !mainAssetData) return;
    setIsExporting(true);

    try {
        const canvas = await html2canvas(chartRef.current, { scale: 3, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        
        const doc = new jsPDF() as jsPDFWithAutoTableType;
        const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let finalY = 0;

        // ===================================
        // CABEÇALHO (NOVO DESIGN)
        // ===================================
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125); // Cinza
        doc.text("UCS INDEX REPORT", margin, 20);

        doc.setFontSize(22);
        doc.setTextColor(33, 37, 41); // Preto
        doc.setFont('helvetica', 'bold');
        doc.text(`Análise de Ativo: ${selectedAssetConfig.name}`, margin, 32);
        
        // --- DATA BOX ---
        doc.setFillColor(40, 167, 69); // Verde
        const dateBoxWidth = 70;
        doc.rect(pdfWidth - dateBoxWidth - margin, 15, dateBoxWidth, 20, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text("Data da Análise", pdfWidth - margin - dateBoxWidth + 5, 22);
        
        doc.setFontSize(12);
        doc.text(format(targetDate, "dd 'de' MMMM, yyyy", { locale: ptBR }), pdfWidth - margin - dateBoxWidth + 5, 30);
        
        finalY = 55;

        // ===================================
        // CARDS DE RESUMO (KPIs)
        // ===================================
        const cardWidth = (pdfWidth - (margin * 2) - 10) / 2;
        
        // Card Preço de Fechamento
        doc.setFillColor(248, 249, 250);
        doc.setDrawColor(222, 226, 230);
        doc.roundedRect(margin, finalY, cardWidth, 30, 3, 3, 'FD');
        doc.setFillColor(0, 123, 255); // Azul
        doc.rect(margin, finalY, 5, 30, 'F');

        // Card Variação
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin + cardWidth + 10, finalY, cardWidth, 30, 3, 3, 'FD');
        const changeColor = mainAssetData.change >= 0 ? [40, 167, 69] : [220, 53, 69];
        doc.setFillColor(changeColor[0], changeColor[1], changeColor[2]);
        doc.rect(margin + cardWidth + 10, finalY, 5, 30, 'F');

        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125);
        doc.text("Preço de Fechamento", margin + 12, finalY + 9);
        doc.text("Variação (24h)", margin + cardWidth + 22, finalY + 9);
        
        doc.setFontSize(18);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(mainAssetData.price, mainAssetData.currency, mainAssetData.id), margin + 12, finalY + 20);
        
        const changeText = `${mainAssetData.change >= 0 ? '+' : ''}${mainAssetData.change.toFixed(2)}%`;
        doc.text(changeText, margin + cardWidth + 22, finalY + 20);

        doc.setFontSize(9);
        doc.setTextColor(108, 117, 125);
        doc.text(`Absoluto: ${formatCurrency(mainAssetData.absoluteChange, mainAssetData.currency, mainAssetData.id)}`, margin + cardWidth + 22, finalY + 26);
        
        finalY += 30 + 15;
        
        // ===================================
        // GRÁFICO
        // ===================================
        doc.setFontSize(14);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text("Histórico de Preços (Últimos 90 dias)", margin, finalY);
        finalY += 7;

        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', margin, finalY, imgWidth, imgHeight);

        finalY += imgHeight + 10;
        
        // ===================================
        // TABELAS DE DETALHES
        // ===================================
        let detailsToExport: { label: string, value: string | null }[] = [];
        let tableTitle = "Resumo do Dia";
        let tableColor: [number, number, number] = [52, 58, 64];

        if (selectedAssetConfig.id === 'soja') {
            detailsToExport = [
                { label: 'Preço (Último)', value: formatCurrency(latestQuote.ultimo, 'USD') + ' / saca' },
                { label: 'Cotação Dólar Usada', value: formatCurrency(latestQuote.cotacao_dolar, 'BRL', 'usd') },
                { label: 'Preço Convertido', value: formatCurrency(latestQuote.ultimo_brl, 'BRL') + ' / saca' },
                { label: 'Valor em Toneladas', value: formatCurrency(latestQuote.ton, 'BRL') + ' / ton' },
                { label: 'Rentabilidade Média', value: formatCurrency(latestQuote.rent_media, 'BRL') + ' / ha' },
            ];
            tableTitle = "Detalhes da Cotação: Soja";
            tableColor = [40, 167, 69];
        } else if (selectedAssetConfig.id === 'carbono') {
             detailsToExport = [
                { label: 'Preço (Último)', value: formatCurrency(latestQuote.ultimo, 'EUR') + ' / ton' },
                { label: 'Cotação Euro Usada', value: formatCurrency(latestQuote.cotacao_euro, 'BRL', 'eur') },
                { label: 'Preço Convertido', value: formatCurrency(latestQuote.ultimo_brl, 'BRL') + ' / ton' },
                { label: 'Rentabilidade Média', value: formatCurrency(latestQuote.rent_media, 'BRL') + ' / ha' },
            ];
            tableTitle = "Detalhes da Cotação: Carbono";
            tableColor = [23, 162, 184];
        } else if (selectedAssetConfig.id !== 'ucs_ase') {
             detailsToExport = [
                { label: 'Fechamento Anterior', value: formatCurrency(latestQuote.fechamento_anterior, mainAssetData.currency) },
                { label: 'Abertura', value: formatCurrency(latestQuote.abertura, mainAssetData.currency) },
                { label: 'Variação Diária (Min-Max)', value: `${formatCurrency(latestQuote.minima, mainAssetData.currency)} - ${formatCurrency(latestQuote.maxima, mainAssetData.currency)}` },
                { label: 'Volume', value: latestQuote.volume?.toLocaleString('pt-BR') || 'N/A' },
            ].filter(item => item.value !== null && item.value !== undefined && !item.value.includes('NaN'));
        }

        if (detailsToExport.length > 0) {
            doc.autoTable({
                startY: finalY,
                head: [[{ content: tableTitle, styles: { halign: 'left', fillColor: tableColor, textColor: 255, fontStyle: 'bold' } }]],
                body: detailsToExport.map(item => [item.label, item.value]),
                theme: 'grid',
                didDrawPage: (data) => { finalY = data.cursor?.y || finalY; }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        if (selectedAssetConfig.id === 'ucs_ase' && latestQuote.componentes) {
            doc.autoTable({
                startY: finalY,
                head: [[{ content: "Composição e Conversão do Índice UCS ASE", colSpan: 2, styles: { halign: 'center', fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' } }]],
                body: [
                    ['UCS Original (BRL)', formatCurrency(latestQuote.valores_originais?.ucs || 0, 'BRL', 'ucs')],
                    ['Fórmula', latestQuote.formula || 'UCS × 2'],
                    [{ content: 'Resultado Final (BRL)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(latestQuote.componentes.resultado_final_brl || 0, 'BRL', 'ucs_ase'), styles: { fontStyle: 'bold' } }],
                    [{ content: '--- Conversões ---', colSpan: 2, styles: { fillColor: [248, 249, 250], textColor: 80, halign: 'center' } }],
                    ['Cotação USD/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_usd || 0, 'BRL', 'usd')],
                    [{ content: 'Valor Final (USD)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(latestQuote.componentes.resultado_final_usd || 0, 'USD', 'ucs_ase'), styles: { fontStyle: 'bold' } }],
                    ['Cotação EUR/BRL', formatCurrency(latestQuote.valores_originais?.cotacao_eur || 0, 'BRL', 'eur')],
                    [{ content: 'Valor Final (EUR)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(latestQuote.componentes.resultado_final_eur || 0, 'EUR', 'ucs_ase'), styles: { fontStyle: 'bold' } }],
                ],
                theme: 'grid',
            });
        }

        // ===================================
        // RODAPÉ
        // ===================================
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount} | Relatório gerado em ${generationDate}`, pdfWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
        
        doc.save(`relatorio_ativo_${selectedAssetConfig.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
            size="sm"
            onClick={handleExportPdf}
            disabled={isLoading || isExporting || data.length === 0}
            title="Exportar para PDF"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            <span className="ml-2">Exportar PDF</span>
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
                AssetSpecificDetails({ asset: mainAssetData, quote: latestQuote }) || <GenericAssetDetails asset={mainAssetData} quote={latestQuote} />
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
                onRowClick={() => {}}
              />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
