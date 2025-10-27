

'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices, clearCacheAndRefresh, reprocessDate } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { addDays, format, parseISO, isValid, isToday, isFuture } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/lib/language-context';
import { DateNavigator } from '@/components/date-navigator';
import { Skeleton } from '@/components/ui/skeleton';
import { MainIndexCard } from '@/components/main-index-card';
import type { CommodityPriceData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, History, FileDown, Loader2, ArrowLeftCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// ExcelJS e file-saver são importados sob demanda nos handlers de exportação para reduzir o bundle
import { formatCurrency } from '@/lib/formatters';
import { PdfExportButton } from '@/components/pdf-export-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { DateComparison } from '@/components/admin/date-comparison';


function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }

  const handleGoToPreviousBusinessDay = async () => {
      try {
          const res = await fetch(`/api/business-day/previous?date=${format(targetDate, 'yyyy-MM-dd')}`);
          const json = await res.json();
          if (json?.success && json?.date) {
              const newDate = new Date(json.date);
              setTargetDate(newDate);
              const iso = format(newDate, 'yyyy-MM-dd');
              const params = new URLSearchParams(window.location.search);
              params.set('date', iso);
              router.replace(`?${params.toString()}`);
              toast({ title: 'Navegado', description: `Exibindo último dia útil: ${format(newDate, 'dd/MM/yyyy')}` });
          } else {
              toast({ variant: 'destructive', title: 'Não foi possível localizar', description: 'Tente novamente em instantes.' });
          }
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erro ao buscar dia útil anterior' });
      }
  }
  }
  return null;
}

const getDateLocale = (language: string) => {
  switch (language) {
    case 'en': return enUS;
    case 'es': return es;
    default: return ptBR;
  }
};

function useRealtimeData(initialDate: Date | null) {
    const [data, setData] = useState<CommodityPriceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isCurrentDateOrFuture = initialDate ? isToday(initialDate) || isFuture(initialDate) : true;

    useEffect(() => {
        if (!initialDate) return;

        let intervalId: NodeJS.Timeout | undefined;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                const result = isCurrentDateOrFuture
                    ? await getCommodityPrices()
                    : await getCommodityPricesByDate(initialDate);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Optionally set an error state here
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        if (isCurrentDateOrFuture) {
            // Poll for new data every 30 seconds for "real-time" feel
            intervalId = setInterval(fetchData, 30000); 
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

    }, [initialDate, isCurrentDateOrFuture]);

    return { data, isLoading };
}


export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  
  useEffect(() => {
    const initialDate = getValidatedDate(dateParam) || new Date();
    setTargetDate(initialDate);
  }, [dateParam]);
  
  const { data, isLoading } = useRealtimeData(targetDate);
  const allBlocked = useMemo(() => data.length > 0 && data.every(d => (d as any).isBlocked), [data]);
  
  const { mainIndex, secondaryIndices, currencies, otherAssets } = useMemo(() => {
    const main = data.find(d => d.id === 'ucs_ase');
    const secondary = data.filter(d => ['pdm', 'ucs'].includes(d.id)).sort((a, b) => a.name.localeCompare(b.name));
    const currencyAssets = data.filter(d => ['usd', 'eur'].includes(d.id));
    const remainingAssets = data.filter(d => !['ucs_ase', 'pdm', 'ucs', 'usd', 'eur'].includes(d.id));
    return { mainIndex: main, secondaryIndices: secondary, currencies: currencyAssets, otherAssets: remainingAssets };
  }, [data]);
  
  const handleRefresh = () => {
    startTransition(async () => {
      await clearCacheAndRefresh();
      router.refresh();
      toast({
        title: "Dados Atualizados",
        description: "As cotações foram atualizadas com sucesso.",
      });
    });
  };
  
  const handleReprocess = async () => {
      if (!targetDate) return;
      
      startTransition(async () => {
          const result = await reprocessDate(targetDate);
          if (result.success) {
              toast({
                  title: "Reprocessamento Iniciado",
                  description: result.message,
              });
              // Dá um tempo para o n8n processar e depois atualiza
              setTimeout(() => {
                router.refresh();
              }, 5000); 
          } else {
               toast({
                  variant: 'destructive',
                  title: "Falha no Reprocessamento",
                  description: result.message,
              });
          }
      });
  }

  const handleExportExcel = async (fileFormat: 'xlsx' | 'csv' = 'xlsx') => {
    if (!targetDate || data.length === 0) {
        toast({
            variant: 'destructive',
            title: t.excelExport.messages.exportError,
            description: t.excelExport.messages.noDataToExport,
        });
        return;
    }
    setIsExporting(true);
    
    try {
        if (fileFormat === 'csv') {
          const allData = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean) as CommodityPriceData[];
          const headers = [
            t.excelExport.headers.category,
            t.excelExport.headers.asset,
            t.excelExport.headers.lastPrice,
            t.excelExport.headers.variationPercent,
            t.excelExport.headers.absoluteVariation,
            t.excelExport.headers.unit,
            t.excelExport.headers.currency,
            t.excelExport.headers.status,
            t.excelExport.headers.lastUpdate,
          ];
          const rows = allData.map(asset => {
            const status = asset.change > 0 ? 'Alta' : asset.change < 0 ? 'Baixa' : 'Estável';
            return [
              asset.category,
              asset.name,
              asset.price,
              (asset.change / 100).toFixed(4),
              asset.absoluteChange,
              asset.unit,
              asset.currency,
              status,
              asset.lastUpdated,
            ];
          });
          const csv = [headers, ...rows]
            .map(r => r.map(v => (typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : String(v))).join(','))
            .join('\n');
          const { saveAs } = await import('file-saver');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          saveAs(blob, `UCS_Index_${format(targetDate, 'yyyy-MM-dd')}.csv`);
          toast({ title: t.excelExport.messages.exportSuccess });
          return;
        }

        const { default: ExcelJS } = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UCS Index Platform';
        workbook.created = new Date();
        
        // --- ABA 1: PAINEL DE COTAÇÕES ---
        const worksheet = workbook.addWorksheet('📊 Painel de Cotações');

        // Cabeçalho e subtítulo
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = '🏛️ UCS INDEX - PAINEL DE COTAÇÕES';
        worksheet.getCell('A1').font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16a34a' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('A2:J2');
        worksheet.getCell('A2').value = `📅 ${t.excelExport.executiveSummary.dataFor} ${format(targetDate, 'dd/MM/yyyy', { locale: getDateLocale(language) })}`;
        worksheet.getCell('A2').font = { name: 'Calibri', size: 11, color: { argb: 'FF6b7280' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Estatísticas Resumidas
        const allData = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean) as CommodityPriceData[];
        const totalAssets = allData.length;
        const positiveChanges = allData.filter(asset => asset.change > 0).length;
        const negativeChanges = allData.filter(asset => asset.change < 0).length;
        const stableChanges = allData.filter(asset => asset.change === 0).length;

        worksheet.addRow([]);
        const statsRow = worksheet.addRow([
            t.excelExport.summary.title, ``, `${t.excelExport.summary.total}: ${totalAssets}`,
            `${t.excelExport.summary.rising}: ${positiveChanges}`, `${t.excelExport.summary.falling}: ${negativeChanges}`,
            `${t.excelExport.summary.stable}: ${stableChanges}`
        ]);
        statsRow.font = { bold: true };
        worksheet.addRow([]);

        // Cabeçalhos da tabela
        const headerRow = worksheet.addRow([
            t.excelExport.headers.category, t.excelExport.headers.asset, t.excelExport.headers.lastPrice,
            t.excelExport.headers.variationPercent, t.excelExport.headers.absoluteVariation, t.excelExport.headers.unit,
            t.excelExport.headers.currency, t.excelExport.headers.status, t.excelExport.headers.lastUpdate,
            t.excelExport.headers.notes
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Adicionar dados
        allData.forEach((asset) => {
            const status = asset.change > 0 ? '📈 Alta' : asset.change < 0 ? '📉 Baixa' : '➡️ Estável';
            const observation = Math.abs(asset.change) > 5 ? '🔥 Alta volatilidade' : '✅ Normal';
            
            const row = worksheet.addRow([
                asset.category,
                asset.name,
                asset.price,
                asset.change / 100,
                asset.absoluteChange,
                asset.unit,
                asset.currency,
                status,
                asset.lastUpdated,
                observation
            ]);

            // Formatação
            row.getCell(3).numFmt = `#,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;
            row.getCell(4).numFmt = '0.00%';
            row.getCell(5).numFmt = `#,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;
            
            if(asset.change > 0) row.getCell(4).font = { color: { argb: 'FF008000' }, bold: true };
            else if(asset.change < 0) row.getCell(4).font = { color: { argb: 'FFFF0000' }, bold: true };
        });
        
        // --- ABA 2: ANÁLISES COM GRÁFICOS VISUAIS ---
        const analysisWorksheet = workbook.addWorksheet('📈 Análises Visuais');
        
        const categoryData = allData.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const variationsData = allData
            .filter(asset => Math.abs(asset.change) > 0.01)
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 15);
        
        // --- VISUALIZAÇÃO DA DISTRIBUIÇÃO POR CATEGORIA ---
        let currentRow = 2;
        analysisWorksheet.mergeCells(`A${currentRow}:${'D'}${currentRow}`);
        analysisWorksheet.getCell(`A${currentRow}`).value = '🍕 Distribuição por Categoria';
        analysisWorksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
        currentRow += 2;

        const categoryHeaders = analysisWorksheet.getRow(currentRow++);
        categoryHeaders.values = [t.excelExport.charts.category, t.excelExport.charts.quantity, t.excelExport.charts.percentage, 'Visualização'];
        categoryHeaders.font = { bold: true };

        Object.entries(categoryData).forEach(([category, count]) => {
            const row = analysisWorksheet.getRow(currentRow++);
            const percentage = (count / totalAssets);
            const bar = '█'.repeat(Math.round(percentage * 20));
            row.values = [category, count, percentage, bar];
            row.getCell(3).numFmt = '0.00%';
        });
        currentRow += 2;

        // --- VISUALIZAÇÃO DAS MAIORES VARIAÇÕES ---
        analysisWorksheet.mergeCells(`A${currentRow}:${'D'}${currentRow}`);
        analysisWorksheet.getCell(`A${currentRow}`).value = `📊 ${t.excelExport.charts.topVariations}`;
        analysisWorksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
        currentRow += 2;

        const variationsHeaders = analysisWorksheet.getRow(currentRow++);
        variationsHeaders.values = [t.excelExport.charts.rank, t.excelExport.charts.asset, t.excelExport.charts.variation, 'Visualização'];
        variationsHeaders.font = { bold: true };

        variationsData.forEach((asset, index) => {
            const row = analysisWorksheet.getRow(currentRow++);
            const maxVariation = Math.max(...variationsData.map(v => Math.abs(v.change)));
            const bar = '█'.repeat(Math.round((Math.abs(asset.change) / maxVariation) * 20));
            row.values = [index + 1, asset.name, asset.change / 100, bar];
            row.getCell(3).numFmt = '0.00%';
            
            if(asset.change > 0) row.getCell(3).font = { color: { argb: 'FF008000' } };
            else if(asset.change < 0) row.getCell(3).font = { color: { argb: 'FFFF0000' } };
        });

        // --- ABA 3: RESUMO EXECUTIVO ---
        const summaryWorksheet = workbook.addWorksheet('📋 Resumo Executivo');
        currentRow = 2;
        summaryWorksheet.mergeCells(`A${currentRow}:${'E'}${currentRow}`);
        summaryWorksheet.getCell(`A${currentRow}`).value = t.excelExport.executiveSummary.title;
        summaryWorksheet.getCell(`A${currentRow}`).font = { bold: true, size: 18 };
        currentRow+=2;

        summaryWorksheet.getCell(`A${currentRow}`).value = t.excelExport.executiveSummary.keyMetrics;
        summaryWorksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
        summaryWorksheet.getRow(currentRow++).values = [`${t.excelExport.summary.total}:`, totalAssets];
        summaryWorksheet.getRow(currentRow++).values = [`${t.excelExport.summary.rising}:`, positiveChanges];
        summaryWorksheet.getRow(currentRow++).values = [`${t.excelExport.summary.falling}:`, negativeChanges];
        summaryWorksheet.getRow(currentRow++).values = [`${t.excelExport.summary.stable}:`, stableChanges];
        currentRow+=2;

        const topAssetsByPrice = allData
            .sort((a, b) => b.price - a.price)
            .slice(0, 5);

        summaryWorksheet.getCell(`A${currentRow}`).value = `📈 ${t.excelExport.charts.priceTrends}`;
        summaryWorksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow+=2;
        const trendHeaders = summaryWorksheet.getRow(currentRow++);
        trendHeaders.values = [t.excelExport.charts.asset, t.excelExport.charts.price, t.excelExport.charts.variation];
        trendHeaders.font = { bold: true };

        topAssetsByPrice.forEach((asset) => {
            const row = summaryWorksheet.getRow(currentRow++);
            row.values = [asset.name, asset.price, asset.change / 100];
            row.getCell(2).numFmt = '#,##0.00';
            row.getCell(3).numFmt = '0.00%';
        });


        // Auto-ajuste de colunas
        [worksheet, analysisWorksheet, summaryWorksheet].forEach(ws => {
            ws.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell!({ includeEmpty: true }, (cell) => {
                    const length = cell.value ? cell.value.toString().length : 10;
                    if (length > maxLength) maxLength = length;
                });
                column.width = Math.min(Math.max(maxLength + 2, 12), 40);
            });
        });

        // Salvar o arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `🏛️_UCS_Index_Painel_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);

        toast({
            title: `✅ ${t.excelExport.messages.exportSuccess}`,
            description: `Relatório completo gerado com ${totalAssets} ativos e análises visuais.`,
        });

    } catch (error) {
        console.error('Excel Export Error:', error);
        toast({ 
            variant: 'destructive', 
            title: `❌ ${t.excelExport.messages.exportError}`, 
            description: 'Ocorreu uma falha ao criar a planilha. Tente novamente.' 
        });
    } finally {
        setIsExporting(false);
    }
  };


  if (!targetDate) {
    return (
       <>
          <PageHeader 
            title="Painel de Cotações"
            description="Carregando dados..."
          >
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-[250px]" />
            </div>
          </PageHeader>
          <main className="p-4 md:p-6 space-y-4 md:space-y-8">
              <Skeleton className="h-32 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
          </main>
      </>
    );
  }

  const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  return (
    <>
        <PageHeader
            title="Painel de Cotações"
            description={isCurrentDateOrFuture
                ? "Cotações em tempo real dos principais ativos."
                : `Exibindo cotações para: ${formattedDate}`
            }
        >
            <div className="flex items-center gap-2 flex-wrap">
                <PdfExportButton
                    data={{
                        mainIndex,
                        secondaryIndices,
                        currencies,
                        otherAssets,
                        targetDate
                    }}
                    reportType="dashboard"
                    disabled={isExporting || isLoading || data.length === 0}
                >
                    PDF
                </PdfExportButton>
                <ExcelExportButton
                    data={{
                        mainIndex,
                        secondaryIndices,
                        currencies,
                        otherAssets,
                        targetDate
                    }}
                    onExport={handleExportExcel}
                    variant="outline"
                    size="sm"
                />
                <div className="w-px h-8 bg-border mx-2 hidden sm:block" />
                {isCurrentDateOrFuture ? (
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isPending} title="Atualizar Cotações">
                        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </Button>
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" disabled={isPending} title="Reprocessar dia">
                                <History className={cn("h-4 w-4", isPending && "animate-spin")} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reprocessar Cálculos do Dia?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação acionará o n8n para buscar e recalcular todos os dados para o dia <span className="font-bold">{formattedDate}</span>. Isso pode sobrescrever dados existentes. Use caso suspeite de um erro no processamento original.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReprocess} disabled={isPending}>
                                    Sim, Reprocessar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                {allBlocked && (
                    <Button variant="outline" size="sm" onClick={handleGoToPreviousBusinessDay} title="Ir para o último dia útil">
                        <ArrowLeftCircle className="h-4 w-4 mr-2" />
                        Último dia útil
                    </Button>
                )}
                <DateNavigator
                    targetDate={targetDate}
                />
            </div>
        </PageHeader>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-background to-muted/30">
            {isLoading && data.length === 0 ? (
                <div className="space-y-4 md:space-y-8">
                    <Skeleton className="h-[180px] w-full" />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 md:gap-8">
                    {mainIndex && <MainIndexCard asset={mainIndex} isMain={true} />}

                    {secondaryIndices.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {secondaryIndices.map(asset => <MainIndexCard key={asset.id} asset={asset} />)}
                        </div>
                    )}

                    {currencies.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {currencies.map(asset => <MainIndexCard key={asset.id} asset={asset} />)}
                        </div>
                    )}
                    <CommodityPrices
                        data={otherAssets}
                        displayDate={isCurrentDateOrFuture ? 'Tempo Real' : formattedDate}
                        loading={isLoading && otherAssets.length === 0}
                    />
                </div>
            )}
            {/* Comparativo de datas movido para página dedicada */}
        </main>
    </>
  );
}
