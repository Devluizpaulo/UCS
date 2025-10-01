

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
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { formatCurrency } from '@/lib/formatters';


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
  const dashboardRef = useRef<HTMLDivElement>(null);

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
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 15;

        pdf.setFontSize(16);
        pdf.text(`Painel de Cotações - ${format(targetDate!, 'dd/MM/yyyy')}`, pdfWidth / 2, 10, { align: 'center' });

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        
        pdf.save(`painel_cotacoes_${format(targetDate!, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Ocorreu uma falha ao exportar o painel.' });
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cotações do Dia');

        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Painel de Cotações - ${format(targetDate!, 'dd/MM/yyyy')}`;
        titleCell.font = { name: 'Calibri', size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        worksheet.getRow(3).values = ['Ativo', 'Último Preço', 'Variação (24h)', 'Variação Absoluta', 'Última Atualização'];
        const headerRow = worksheet.getRow(3);
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.border = { bottom: { style: 'thin' } };
        });

        const allData = [mainIndex, ...secondaryIndices, ...currencies, ...otherAssets].filter(Boolean) as CommodityPriceData[];

        allData.forEach((asset) => {
            const row = worksheet.addRow([
                asset.name,
                asset.price,
                asset.change / 100,
                asset.absoluteChange,
                asset.lastUpdated
            ]);

            const priceCell = row.getCell(2);
            priceCell.numFmt = `"${asset.currency}" #,##0.00`;
            if (['usd', 'eur'].includes(asset.id)) {
                priceCell.numFmt = `"${asset.currency}" #,##0.0000`;
            }

            const changeCell = row.getCell(3);
            changeCell.numFmt = '0.00%';
            
            const absChangeCell = row.getCell(4);
            absChangeCell.numFmt = `"${asset.currency}" #,##0.00`;

        });
        
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                // Apenas considera as linhas com conteúdo para o cálculo da largura
                if (rowNumber > 2) {
                    let columnLength = cell.value ? cell.value.toString().length : 10;
                    if (cell.numFmt && typeof cell.value === 'number') {
                       // Estima o tamanho formatado
                       const numStr = cell.value.toFixed(cell.numFmt.includes('0.0000') ? 4 : 2);
                       const currencyPrefix = cell.numFmt.startsWith('"') ? cell.numFmt.substring(1, cell.numFmt.indexOf('"', 1)) + ' ' : '';
                       columnLength = (currencyPrefix + numStr).length;
                    }
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                }
            });
            column.width = maxLength < 12 ? 12 : maxLength + 4;
        });


        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cotacoes_${format(targetDate!, 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao gerar Excel', description: 'Ocorreu uma falha ao exportar a planilha.' });
    } finally {
        setIsExporting(false);
    }
  };


  if (!targetDate) {
    return (
       <div className="flex min-h-screen w-full flex-col">
          <PageHeader 
            title="Painel de Cotações"
            description="Carregando dados..."
          >
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-[250px]" />
            </div>
          </PageHeader>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
          </main>
      </div>
    );
  }

  const isCurrentDateOrFuture = isToday(targetDate) || isFuture(targetDate);
  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader 
        title="Painel de Cotações"
        description={isCurrentDateOrFuture 
            ? "Cotações em tempo real dos principais ativos." 
            : `Exibindo cotações para: ${formattedDate}`
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                PDF
            </Button>
             <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
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
      <main ref={dashboardRef} className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isLoading && data.length === 0 ? (
          <>
            <Skeleton className="h-[180px] w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </>
        ) : (
          <>
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

          </>
        )}
        <CommodityPrices 
          data={otherAssets} 
          displayDate={isCurrentDateOrFuture ? 'Tempo Real' : formattedDate} 
          loading={isLoading && otherAssets.length === 0}
        />
      </main>
    </div>
  );
}
