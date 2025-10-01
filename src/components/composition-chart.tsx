
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import type { CommodityPriceData } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from './ui/skeleton';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getIconForCategory } from '@/lib/icons';
import { Button } from './ui/button';
import { FileDown, FileType, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import XlsxPopulate from 'xlsx-populate';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CompositionData {
    name: string;
    value: number;
    currency: string;
    id: string;
}

interface CompositionChartProps {
    mainAsset?: CommodityPriceData | null;
    compositionData: CompositionData[];
    isLoading: boolean;
    targetDate: Date;
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const ChartLoader = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex items-center justify-center">
             <Skeleton className="h-64 w-64 rounded-full" />
        </div>
        <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    </div>
);


export function CompositionChart({ mainAsset, compositionData, isLoading, targetDate }: CompositionChartProps) {
    const cardContentRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const { toast } = useToast();

    const totalValue = useMemo(() => {
        return compositionData.reduce((sum, item) => sum + item.value, 0);
    }, [compositionData]);

    const chartData = useMemo(() => {
        return compositionData.map(item => ({
            name: item.name,
            value: item.value,
        }));
    }, [compositionData]);
    
    const handleExportPdf = async () => {
        if (!cardContentRef.current) return;
        setIsExportingPdf(true);
        try {
            const canvas = await html2canvas(cardContentRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            const width = pdfWidth - 20;
            const height = width / ratio;
            
            let y = 15;
            pdf.setFontSize(16);
            pdf.text(`Composição do ${mainAsset?.name || 'Índice'}`, pdfWidth / 2, y, { align: 'center' });
            y += 8;
            pdf.setFontSize(10);
            pdf.text(`Data: ${format(targetDate, 'dd/MM/yyyy')}`, pdfWidth / 2, y, { align: 'center' });
            y+= 10;
            
            pdf.addImage(imgData, 'PNG', 10, y, width, height > (pdfHeight - y - 10) ? pdfHeight - y - 10 : height);
            pdf.save(`composicao_${mainAsset?.id}_${format(targetDate, 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Ocorreu uma falha ao exportar o relatório.' });
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportExcel = async () => {
        if (!mainAsset || compositionData.length === 0) return;
        setIsExportingExcel(true);
        try {
             // Create a new workbook
            const workbook = await XlsxPopulate.fromBlankAsync();
            const sheet = workbook.sheet(0);
            sheet.name(`Composição ${mainAsset.name}`);

            // --- Header ---
            sheet.range("A1:C1").merge(true).value(`Relatório de Composição - ${mainAsset.name}`).style({ bold: true, fontSize: 16, horizontalAlignment: "center" });
            sheet.range("A2:C2").merge(true).value(`Data: ${format(targetDate, 'dd/MM/yyyy')} | Valor Total: ${formatCurrency(totalValue, mainAsset.currency, mainAsset.id)}`).style({ italic: true, horizontalAlignment: "center" });
            sheet.row(2).height(20);

            // --- Table Headers ---
            sheet.cell("A4").value("Componente").style("bold", true);
            sheet.cell("B4").value("Valor (BRL)").style("bold", true);
            sheet.cell("C4").value("Participação (%)").style("bold", true);
            sheet.range("A4:C4").style("fill", "E0E0E0");

            // --- Table Data ---
            compositionData.forEach((item, index) => {
                const row = 5 + index;
                const percentage = totalValue > 0 ? item.value / totalValue : 0;
                sheet.cell(`A${row}`).value(item.name);
                sheet.cell(`B${row}`).value(item.value).style("numberFormat", "R$ #,##0.00");
                sheet.cell(`C${row}`).value(percentage).style("numberFormat", "0.00%");
            });

            // --- Total Row ---
            const totalRowIndex = 5 + compositionData.length;
            sheet.cell(`A${totalRowIndex}`).value("Total").style("bold", true);
            sheet.cell(`B${totalRowIndex}`).formula(`SUM(B5:B${totalRowIndex - 1})`).style({ bold: true, numberFormat: "R$ #,##0.00" });
            sheet.cell(`C${totalRowIndex}`).value(1).style({ bold: true, numberFormat: "0.00%" });
            sheet.range(`A${totalRowIndex}:C${totalRowIndex}`).style("borderTop", { style: "thin" });
            
            // --- Column Widths ---
            sheet.column("A").width(25);
            sheet.column("B").width(20);
            sheet.column("C").width(20);

            // --- Add Chart ---
             sheet.addChart({
                type: "pieChart",
                data: {
                    labels: sheet.range(`A5:A${totalRowIndex - 1}`),
                    values: sheet.range(`B5:B${totalRowIndex - 1}`),
                },
                drawing: {
                    topLeftCell: "E4",
                    bottomRightCell: `L20`,
                },
                title: `Composição - ${mainAsset.name}`,
             });


            // --- Generate and Download file ---
            const blob = await workbook.outputAsync();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob as Blob);
            link.download = `composicao_${mainAsset.id}_${format(targetDate, 'yyyy-MM-dd')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error: any) {
            console.error("Excel generation error:", error);
            toast({ variant: "destructive", title: "Erro ao gerar Excel", description: error.message || "Ocorreu uma falha ao exportar a planilha." });
        } finally {
            setIsExportingExcel(false);
        }
    };


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <ChartLoader />
                </CardContent>
            </Card>
        );
    }
    
    if (!mainAsset || compositionData.length === 0 || mainAsset.price === 0) {
         return (
            <Card>
                <CardHeader>
                     <CardTitle>Composição do Valor de Uso do Solo</CardTitle>
                    <CardDescription>
                        Dados de composição para a data selecionada.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-96 items-center justify-center text-center">
                        <p className="text-muted-foreground">Não há dados de composição disponíveis para esta data.<br/>O cálculo pode não ter sido executado ou os componentes não tinham valor.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle>Composição do {mainAsset.name}</CardTitle>
                    <CardDescription>
                        O valor total do índice é <span className="font-bold text-foreground">{formatCurrency(mainAsset.price, mainAsset.currency, mainAsset.id)}</span>, composto pelos seguintes ativos.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExportingPdf || isExportingExcel}>
                        {isExportingPdf ? <Loader2 className="animate-spin" /> : <FileDown />}
                        <span className="ml-2 hidden sm:inline">PDF</span>
                    </Button>
                     <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExportingExcel || isExportingPdf}>
                        {isExportingExcel ? <Loader2 className="animate-spin" /> : <FileType />}
                        <span className="ml-2 hidden sm:inline">Excel</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent ref={cardContentRef}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="w-full h-80">
                         <ResponsiveContainer>
                            <RechartsPieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => [formatCurrency(value, 'BRL', ''), name]}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Componente</TableHead>
                                    <TableHead className="text-right">Valor (BRL)</TableHead>
                                    <TableHead className="text-right">Participação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {compositionData.map((item, index) => {
                                    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                                    const Icon = getIconForCategory({ id: item.id } as CommodityPriceData);
                                    return (
                                        <TableRow key={item.name}>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{item.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.value, 'BRL', item.id)}</TableCell>
                                            <TableCell className="text-right font-mono">{percentage.toFixed(2)}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                                 <TableRow className="font-bold bg-muted/50">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totalValue, 'BRL', mainAsset.id)}</TableCell>
                                    <TableCell className="text-right font-mono">100.00%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

    
