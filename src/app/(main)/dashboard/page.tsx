
'use client';

import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AssetIcon } from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

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
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  
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

  const handleExportPdf = async () => {
    if (!targetDate || data.length === 0) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const formattedDate = format(targetDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const generationDate = format(new Date(), "dd/MM/yyyy HH:mm");
      let finalY = 20;

      // --- Cabeçalho ---
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Painel de Cotações', 15, finalY);
      finalY += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dados para: ${formattedDate}`, 15, finalY);
      finalY += 15;

      const generateSection = (title: string, assets: CommodityPriceData[]) => {
        if (assets.length === 0) return;

        const head = [['Ativo', 'Último Preço', 'Variação (24h)']];
        const body = assets.map(asset => {
          const changeText = `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%`;
          return [asset.name, formatCurrency(asset.price, asset.currency, asset.id), changeText];
        });

        doc.autoTable({
          startY: finalY,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold' },
          didParseCell: (data) => {
             if (data.column.index === 2 && data.section === 'body') {
                const cellValue = data.cell.raw as string;
                if(cellValue.startsWith('+')) {
                    data.cell.styles.textColor = [39, 174, 96]; // Verde
                } else if (cellValue.startsWith('-')) {
                    data.cell.styles.textColor = [192, 57, 43]; // Vermelho
                }
             }
          }
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      };
      
      // Gera seções
      if(mainIndex) generateSection('Índice Principal', [mainIndex]);
      generateSection('Índices Secundários', secondaryIndices);
      generateSection('Moedas', currencies);
      generateSection('Commodities e Outros Ativos', otherAssets);
      
      // --- Rodapé ---
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | Relatório gerado em ${generationDate} | UCS Index`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`painel_cotacoes_${format(targetDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Ocorreu uma falha ao criar o arquivo.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!targetDate || data.length === 0) return;
    setIsExporting(true);
    
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UCS Index Platform';
        workbook.created = new Date();
        
        const worksheet = workbook.addWorksheet('Painel de Cotações');

        // --- Título ---
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Painel de Cotações';
        titleCell.font = { name: 'Calibri', size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:E2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = `Dados para ${format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}`;
        subtitleCell.font = { name: 'Calibri', size: 12, color: { argb: 'FF808080' } };
        subtitleCell.alignment = { horizontal: 'center' };

        worksheet.addRow([]); // Linha em branco

        // --- Cabeçalho da Tabela ---
        const headerRow = worksheet.addRow(['Categoria', 'Ativo', 'Último Preço', 'Variação (%)', 'Variação Absoluta', 'Unidade']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0070F3' }
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // --- Dados ---
        const allData = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean) as CommodityPriceData[];

        allData.forEach((asset) => {
            const row = worksheet.addRow([
                asset.category,
                asset.name,
                asset.price,
                asset.change / 100,
                asset.absoluteChange,
                asset.unit
            ]);

            const priceCell = row.getCell(3);
            priceCell.numFmt = `"${asset.currency}" #,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;
            
            const changeCell = row.getCell(4);
            changeCell.numFmt = '0.00%';
            if(asset.change > 0) changeCell.font = { color: { argb: 'FF008000' } };
            if(asset.change < 0) changeCell.font = { color: { argb: 'FFFF0000' } };
            
            const absChangeCell = row.getCell(5);
            absChangeCell.numFmt = `#,##0.00${['usd', 'eur'].includes(asset.id) ? '00' : ''}`;
        });
        
        // --- Auto-ajuste de colunas ---
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell!({ includeEmpty: true }, (cell) => {
                const length = cell.value ? cell.value.toString().length : 10;
                if (length > maxLength) {
                    maxLength = length;
                }
            });
            column.width = maxLength < 12 ? 12 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `painel_cotacoes_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);

    } catch (error) {
        console.error('Excel Export Error:', error);
        toast({ variant: 'destructive', title: 'Erro ao gerar Excel', description: 'Ocorreu uma falha ao criar a planilha.' });
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
                <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExporting || isLoading || data.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting || isLoading || data.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Excel
                </Button>
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
