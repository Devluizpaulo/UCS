
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CommodityPrices } from '@/components/commodity-prices';
import { getCommodityPricesByDate, getCommodityPrices, clearCacheAndRefresh, reprocessDate } from '@/lib/data-service';
import { PageHeader } from '@/components/page-header';
import { addDays, format, parseISO, isValid, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateNavigator } from '@/components/date-navigator';
import { Skeleton } from '@/components/ui/skeleton';
import { MainIndexCard } from '@/components/main-index-card';
import type { CommodityPriceData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, History, FileDown, Loader2 } from 'lucide-react';
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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatCurrency } from '@/lib/formatters';
import { PdfExportButton } from '@/components/pdf-export-button';
import { ExcelExportButton } from '@/components/excel-export-button';


function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

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

  const handleExportExcel = async () => {
    if (!targetDate || data.length === 0) return;
    setIsExporting(true);
    
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UCS Index Platform';
        workbook.created = new Date();
        
        // === ABA PRINCIPAL: DADOS ===
        const worksheet = workbook.addWorksheet('📊 Painel de Cotações');

        // --- Cabeçalho Profissional com Logo BMV ---
        worksheet.mergeCells('A1:J1');
        const headerCell = worksheet.getCell('A1');
        headerCell.value = '🏛️ UCS INDEX - PAINEL DE COTAÇÕES';
        headerCell.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        headerCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF16a34a' } // Verde UCS
        };

        // Logo BMV integrado
        const logoCell = worksheet.getCell('J1');
        logoCell.value = 'BMV';
        logoCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        logoCell.alignment = { horizontal: 'center', vertical: 'middle' };
        logoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' } // Preto
        };

        // Subtítulo
        worksheet.mergeCells('A2:J2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = `📅 Dados para ${format(targetDate, 'dd/MM/yyyy', { locale: ptBR })} | 🕐 Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;
        subtitleCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF6b7280' } };
        subtitleCell.alignment = { horizontal: 'center' };

        // Estatísticas Resumidas
        const allData = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean) as CommodityPriceData[];
        const totalAssets = allData.length;
        const positiveChanges = allData.filter(asset => asset.change > 0).length;
        const negativeChanges = allData.filter(asset => asset.change < 0).length;
        const stableChanges = allData.filter(asset => asset.change === 0).length;

        worksheet.addRow([]);
        const statsRow = worksheet.addRow([
            '📊 RESUMO ESTATÍSTICO',
            `Total: ${totalAssets}`,
            `📈 Altas: ${positiveChanges}`,
            `📉 Baixas: ${negativeChanges}`,
            `➡️ Estáveis: ${stableChanges}`,
            '',
            '',
            '',
            '',
            ''
        ]);
        
        statsRow.eachCell((cell, colNumber) => {
            if (colNumber === 1) {
                cell.font = { bold: true, size: 12, color: { argb: 'FF1f2937' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
            } else if (colNumber <= 5) {
                cell.font = { bold: true, size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe5e7eb' } };
                cell.alignment = { horizontal: 'center' };
            }
        });

        worksheet.addRow([]);

        // --- Cabeçalho da Tabela Melhorado ---
        const headerRow = worksheet.addRow([
            '🏷️ Categoria', 
            '📋 Ativo', 
            '💰 Último Preço', 
            '📊 Variação (%)', 
            '📈 Variação Absoluta', 
            '📏 Unidade', 
            '💱 Moeda', 
            '🎯 Status',
            '📅 Última Atualização',
            '🔍 Observações'
        ]);
        
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563eb' } // Azul
            };
            cell.border = { 
                top: { style: 'medium', color: { argb: 'FF1e40af' } }, 
                left: { style: 'thin', color: { argb: 'FF3b82f6' } }, 
                bottom: { style: 'medium', color: { argb: 'FF1e40af' } }, 
                right: { style: 'thin', color: { argb: 'FF3b82f6' } }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // --- Dados com Formatação Avançada ---
        allData.forEach((asset, index) => {
            const status = asset.change > 0 ? '📈 Alta' : asset.change < 0 ? '📉 Baixa' : '➡️ Estável';
            const statusColor = asset.change > 0 ? 'FF10b981' : asset.change < 0 ? 'FFef4444' : 'FF6b7280';
            const observation = asset.change > 5 ? '🔥 Alta volatilidade' : 
                              asset.change < -5 ? '⚠️ Queda significativa' : 
                              '✅ Normal';
            
            const row = worksheet.addRow([
                asset.category,
                asset.name,
                asset.price,
                asset.change / 100,
                asset.absoluteChange,
                asset.unit,
                asset.currency,
                status,
                asset.lastUpdated ? format(new Date(asset.lastUpdated), 'dd/MM HH:mm') : 'N/A',
                observation
            ]);

            // Formatação condicional avançada
            const priceCell = row.getCell(3);
            priceCell.numFmt = `#,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;
            priceCell.font = { bold: true };
            
            const changeCell = row.getCell(4);
            changeCell.numFmt = '0.00%';
            if(asset.change > 0) {
                changeCell.font = { color: { argb: 'FF008000' }, bold: true };
                changeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } };
            } else if(asset.change < 0) {
                changeCell.font = { color: { argb: 'FFFF0000' }, bold: true };
                changeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } };
            } else {
                changeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9fafb' } };
            }
            
            const absChangeCell = row.getCell(5);
            absChangeCell.numFmt = `#,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;

            const statusCell = row.getCell(8);
            statusCell.font = { bold: true, color: { argb: statusColor } };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor + '20' } };

            // Alternar cores de fundo para zebra striping
            if (index % 2 === 0) {
                row.eachCell((cell, colNumber) => {
                    if (colNumber !== 4 && colNumber !== 8) { // Não sobrescrever células já coloridas
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
                    }
                });
            }

            // Bordas para todas as células
            row.eachCell(cell => {
                cell.border = { 
                    top: { style: 'thin' }, 
                    left: { style: 'thin' }, 
                    bottom: { style: 'thin' }, 
                    right: { style: 'thin' }
                };
            });
        });

        // === ABA DE ANÁLISES ===
        const analysisWorksheet = workbook.addWorksheet('📈 Análises');

        // Gráfico de Pizza para Categorias
        const categoryData = allData.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        analysisWorksheet.addRow([]);
        analysisWorksheet.addRow([]);
        const chartTitleRow = analysisWorksheet.addRow(['🍕 DISTRIBUIÇÃO POR CATEGORIA']);
        chartTitleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF1f2937' } };
        chartTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe0e7ff' } };

        const chartDataRow = analysisWorksheet.addRow(['Categoria', 'Quantidade', 'Percentual']);
        chartDataRow.font = { bold: true };
        chartDataRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
            cell.font = { color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
        });

        Object.entries(categoryData).forEach(([category, count]) => {
            const percentage = (count / totalAssets) * 100;
            const row = analysisWorksheet.addRow([category, count, percentage / 100]);
            row.getCell(3).numFmt = '0.00%';
            row.eachCell(cell => {
                cell.alignment = { horizontal: 'center' };
            });
        });

        
        // Gráfico de Barras para Variações
        const variationsData = allData
            .filter(asset => Math.abs(asset.change) > 0.01)
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 15); // Top 15 maiores variações

        if (variationsData.length > 0) {
            analysisWorksheet.addRow([]);
            analysisWorksheet.addRow([]);
            const barChartTitleRow = analysisWorksheet.addRow(['📊 TOP 15 MAIORES VARIAÇÕES']);
            barChartTitleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF1f2937' } };
            barChartTitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe0e7ff' } };

            const barChartDataRow = analysisWorksheet.addRow(['Rank', 'Ativo', 'Variação (%)', 'Categoria']);
            barChartDataRow.font = { bold: true };
            barChartDataRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
                cell.font = { color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center' };
            });

            variationsData.forEach((asset, index) => {
                const row = analysisWorksheet.addRow([
                    index + 1,
                    asset.name, 
                    asset.change / 100, 
                    asset.category
                ]);
                
                const variationCell = row.getCell(3);
                variationCell.numFmt = '0.00%';
                variationCell.alignment = { horizontal: 'center' };
                
                if(asset.change > 0) {
                    variationCell.font = { color: { argb: 'FF008000' }, bold: true };
                    variationCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd1fae5' } };
                } else {
                    variationCell.font = { color: { argb: 'FFFF0000' }, bold: true };
                    variationCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } };
                }
                
                row.eachCell((cell, colNumber) => {
                    if (colNumber !== 3) cell.alignment = { horizontal: 'center' };
                });
            });
        }

        // === ABA DE RESUMO EXECUTIVO ===
        const summaryWorksheet = workbook.addWorksheet('📋 Resumo Executivo');

        // Cabeçalho
        summaryWorksheet.mergeCells('A1:E1');
        const summaryHeader = summaryWorksheet.getCell('A1');
        summaryHeader.value = '📊 RESUMO EXECUTIVO - UCS INDEX';
        summaryHeader.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16a34a' } };

        summaryWorksheet.mergeCells('A2:E2');
        const summarySubtitle = summaryWorksheet.getCell('A2');
        summarySubtitle.value = `Data: ${format(targetDate, 'dd/MM/yyyy', { locale: ptBR })} | Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;
        summarySubtitle.font = { name: 'Calibri', size: 11, color: { argb: 'FF6b7280' } };
        summarySubtitle.alignment = { horizontal: 'center' };

        // KPIs principais
        summaryWorksheet.addRow([]);
        summaryWorksheet.addRow([]);
        const kpisRow = summaryWorksheet.addRow([
            '📊 MÉTRICAS PRINCIPAIS',
            `Total de Ativos: ${totalAssets}`,
            `Tendência de Alta: ${positiveChanges}`,
            `Tendência de Baixa: ${negativeChanges}`,
            `Estáveis: ${stableChanges}`
        ]);
        
        kpisRow.eachCell((cell, colNumber) => {
            if (colNumber === 1) {
                cell.font = { bold: true, size: 14, color: { argb: 'FF1f2937' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
            } else {
                cell.font = { bold: true, size: 12 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe5e7eb' } };
                cell.alignment = { horizontal: 'center' };
            }
        });

        // Auto-ajuste de colunas em todas as abas
        [worksheet, analysisWorksheet, summaryWorksheet].forEach(ws => {
            ws.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell!({ includeEmpty: true }, (cell) => {
                const length = cell.value ? cell.value.toString().length : 10;
                if (length > maxLength) {
                    maxLength = length;
                }
            });
                column.width = Math.min(Math.max(maxLength + 2, 12), 35);
            });
        });

        // Rodapé profissional
        const footerRow = allData.length + 25;
        worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
        const footerCell = worksheet.getCell(`A${footerRow}`);
        footerCell.value = `🏛️ UCS Index Platform | 📧 suporte@ucsindex.com | 🌐 www.ucsindex.com | Relatório confidencial gerado automaticamente`;
        footerCell.font = { size: 9, italic: true, color: { argb: 'FF9ca3af' } };
        footerCell.alignment = { horizontal: 'center' };
        footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9fafb' } };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `🏛️_UCS_Index_Painel_Completo_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);

        toast({
            title: '✅ Excel Exportado com Sucesso!',
            description: `Relatório completo gerado com ${totalAssets} ativos, análises e resumo.`,
        });

    } catch (error) {
        console.error('Excel Export Error:', error);
        toast({ 
            variant: 'destructive', 
            title: '❌ Erro ao gerar Excel', 
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
        </main>
    </>
  );
}

    