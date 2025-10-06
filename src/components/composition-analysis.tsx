
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuoteByDate } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Extende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

interface CompositionAnalysisProps {
  targetDate: Date;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const componentNames: Record<string, string> = {
  vus: 'VUS (Valor de Uso do Solo)',
  vmad: 'VMAD (Valor da Madeira)',
  crs: 'CRS (Custo de Resp. Socioambiental)',
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export function CompositionAnalysis({ targetDate }: CompositionAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getQuoteByDate('valor_uso_solo', targetDate);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch composition data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [targetDate]);

  const chartData = useMemo(() => {
    if (!data?.componentes) return [];

    const componentes = data.componentes;
    const valorTotal = data.valor || 1;

    const vusValue = (componentes.vus || 0) as number;
    const vmadValue = (componentes.vmad || 0) as number;
    const carbonoCRSValue = (componentes.carbono_crs || 0) as number;
    const aguaCRSValue = (componentes.Agua_CRS || 0) as number;
    
    const crsTotalValue = carbonoCRSValue + aguaCRSValue;

    const groupedData = [
      {
        name: componentNames.vus,
        value: vusValue,
        percentage: valorTotal > 0 ? (vusValue / valorTotal) * 100 : 0,
      },
      {
        name: componentNames.vmad,
        value: vmadValue,
        percentage: valorTotal > 0 ? (vmadValue / valorTotal) * 100 : 0,
      },
      {
        name: componentNames.crs,
        value: crsTotalValue,
        percentage: valorTotal > 0 ? (crsTotalValue / valorTotal) * 100 : 0,
      }
    ];

    return groupedData.filter(item => item.value > 0);
  }, [data]);

  const handleExportPdf = async () => {
    if (!data || chartData.length === 0 || !chartRef.current) return;
    setIsExporting(true);
  
    const chartElement = chartRef.current;
    const originalBg = chartElement.style.backgroundColor;
    chartElement.style.backgroundColor = 'white';

    try {
      const canvas = await html2canvas(chartElement, { 
        scale: 2,
        useCORS: true,
      });
      chartElement.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/png');
  
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let finalY = 0;
      
      // --- CABEÇALHO ---
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text("COMPOSITION REPORT", margin, 20);

      doc.setFontSize(22);
      doc.setTextColor(33, 37, 41);
      doc.setFont('helvetica', 'bold');
      doc.text('Composição do "Valor de Uso do Solo"', margin, 32);

      doc.setFillColor(40, 167, 69);
      const dateBoxWidth = 70;
      doc.rect(pdfWidth - dateBoxWidth - margin, 15, dateBoxWidth, 20, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Data da Análise", pdfWidth - dateBoxWidth - margin + 5, 22);
      
      doc.setFontSize(12);
      doc.text(data.data, pdfWidth - dateBoxWidth - margin + 5, 30);

      finalY = 55;
  
      // --- GRÁFICO ---
      const imgProps = doc.getImageProperties(imgData);
      const imgWidth = pdfWidth * 0.6;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const xPos = (pdfWidth / 2) - (imgWidth / 2);
      doc.addImage(imgData, 'PNG', xPos, finalY, imgWidth, imgHeight);
      finalY += imgHeight + 10;
  
      // --- TABELA DE DADOS ---
      const tableData = chartData.map(item => [
          item.name,
          formatCurrency(item.value, 'BRL'),
          `${item.percentage.toFixed(2)}%`
      ]);
  
      doc.autoTable({
          startY: finalY,
          head: [['Componente', 'Valor (R$)', 'Participação (%)']],
          body: tableData,
          foot: [['Total', formatCurrency(data.valor, 'BRL', 'valor_uso_solo'), '100.00%']],
          theme: 'grid',
          headStyles: { 
            fillColor: [40, 167, 69], 
            textColor: 255, 
            fontStyle: 'bold' 
          },
          footStyles: { 
            fillColor: [33, 37, 41],
            textColor: 255, 
            fontStyle: 'bold' 
          },
          didDrawPage: (data: any) => {
            const pageCount = (doc.internal as any).getNumberOfPages();
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(
              `Página ${data.pageNumber} de ${pageCount} | Relatório gerado em ${generationDate}`,
              pdfWidth / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'center' }
            );
          }
      });
  
      doc.save(`composicao_valor_uso_solo_${format(targetDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportExcel = async () => {
    if (!data || chartData.length === 0) return;
    setIsExporting(true);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Composição');

    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'Relatório de Composição - Valor de Uso do Solo';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = `Data: ${data.data}`;
    worksheet.getCell('A2').font = { size: 12 };
    
    worksheet.getRow(4).values = ['Componente', 'Valor (R$)', 'Participação (%)'];
    worksheet.getRow(4).font = { bold: true };

    chartData.forEach((item, index) => {
        const row = worksheet.getRow(5 + index);
        row.getCell(1).value = item.name;
        row.getCell(2).value = item.value;
        row.getCell(2).numFmt = '"R$"#,##0.00';
        row.getCell(3).value = item.percentage / 100;
        row.getCell(3).numFmt = '0.00%';
    });
    
    const totalRow = worksheet.getRow(5 + chartData.length);
    totalRow.getCell(1).value = 'Total';
    totalRow.getCell(2).value = data.valor;
    totalRow.getCell(3).value = 1;
    totalRow.font = { bold: true };
    totalRow.getCell(2).numFmt = '"R$"#,##0.00';
    totalRow.getCell(3).numFmt = '0.00%';

    worksheet.columns.forEach(column => {
        let max_width = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
            const columnWidth = cell.value ? cell.value.toString().length : 10;
            if (columnWidth > max_width) {
                max_width = columnWidth;
            }
        });
        column.width = max_width < 12 ? 12 : max_width + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `composicao_valor_uso_solo_${format(targetDate, 'yyyy-MM-dd')}.xlsx`);
    setIsExporting(false);
  };


  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-72 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Indisponíveis</CardTitle>
          <CardDescription>Não foi possível carregar os dados de composição para a data selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72 text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhuma composição encontrada para {targetDate.toLocaleDateString('pt-BR')}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle>Composição do Índice "Valor de Uso do Solo"</CardTitle>
                        <CardDescription>
                            Distribuição percentual dos componentes que formam o valor total de {formatCurrency(data.valor, 'BRL', 'valor_uso_solo')} em {data.data}.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button onClick={handleExportPdf} disabled={isExporting} variant="outline" size="sm">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Exportar (PDF)
                        </Button>
                        <Button onClick={handleExportExcel} disabled={isExporting} variant="outline" size="sm">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Exportar (XLSX)
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-96">
                <div ref={chartRef} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                      >
                      {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      </Pie>
                      <Tooltip
                          formatter={(value: number, name: string) => [formatCurrency(value, 'BRL'), name]}
                      />
                      <Legend />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Valores dos Componentes</CardTitle>
                <CardDescription>Detalhes de cada componente do índice.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Componente</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">(%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chartData.map((item, index) => (
                            <TableRow key={item.name}>
                                <TableCell className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="font-medium">{item.name}</span>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.value, 'BRL')}</TableCell>
                                <TableCell className="text-right font-mono">{item.percentage.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(data.valor, 'BRL', 'valor_uso_solo')}</TableCell>
                            <TableCell className="text-right font-mono">100.00%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
