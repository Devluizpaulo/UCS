'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, ChevronLeft, ChevronRight, Calendar, FileSpreadsheet, FileText, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCompositionHistoricalData } from '@/lib/data-service';

interface HistoricalCompositionTableProps {
  className?: string;
}

const ITEMS_PER_PAGE = 10;

// Função para formatar porcentagens de forma consistente
const formatPercentage = (percentage: string | undefined): string => {
  if (!percentage) return '0.00%';
  
  // Remove o símbolo % se existir
  const cleanValue = percentage.replace('%', '');
  const numericValue = parseFloat(cleanValue);
  
  // Retorna formatado com 2 casas decimais
  return `${numericValue.toFixed(2)}%`;
};

export function HistoricalCompositionTable({ className }: HistoricalCompositionTableProps) {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [pdfRecordsCount, setPdfRecordsCount] = React.useState<number | string>(10);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 [HistoricalCompositionTable] Fetching historical data`);
      
      const result = await getCompositionHistoricalData(100); // Buscar mais dados para paginação
      
      if (!result || result.length === 0) {
        console.log(`❌ [HistoricalCompositionTable] No historical data found`);
        setError('Nenhum dado histórico encontrado');
      } else {
        console.log(`✅ [HistoricalCompositionTable] Found ${result.length} historical records`);
        setData(result);
        setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("❌ [HistoricalCompositionTable] Failed to fetch historical data:", error);
      setError('Erro ao carregar dados históricos');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['Data', 'Valor Total', 'VUS', '%', 'VMAD', '%', 'Carbono', '%', 'Água', '%', 'Fonte'],
      ...data.map(item => [
        item.data,
        formatCurrency(item.valor, 'BRL'),
        formatCurrency(item.valores_originais?.vus || 0, 'BRL'),
        formatPercentage(item.porcentagens?.vus_p),
        formatCurrency(item.valores_originais?.vmad || 0, 'BRL'),
        formatPercentage(item.porcentagens?.vmad_p),
        formatCurrency(item.valores_originais?.carbono_crs || 0, 'BRL'),
        formatPercentage(item.porcentagens?.carbono_crs_p),
        formatCurrency(item.valores_originais?.agua_crs || 0, 'BRL'),
        formatPercentage(item.porcentagens?.agua_crs_p),
        item.fonte || 'N/A'
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Históricos');
    
    // Definir larguras das colunas
    const columnWidths = [
      { wch: 12 }, // Data
      { wch: 18 }, // Valor Total
      { wch: 15 }, // VUS
      { wch: 8 },  // %
      { wch: 15 }, // VMAD
      { wch: 8 },  // %
      { wch: 15 }, // Carbono
      { wch: 8 },  // %
      { wch: 15 }, // Água
      { wch: 8 },  // %
      { wch: 25 }  // Fonte
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `dados_historicos_composition_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Obter a quantidade de registros selecionada pelo usuário
    const selectedData = pdfRecordsCount === 'all' ? data : data.slice(0, pdfRecordsCount);
    
    // Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados Históricos - Composição do Índice', 20, 20);
    
    // Data atual/selecionada em destaque
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Foco na Data: ${selectedData[0]?.data || 'N/A'}`, 20, 35);
    
    // Data de geração e quantidade de registros
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
    doc.text(`Mostrando ${pdfRecordsCount === 'all' ? 'todos os' : 'os últimos'} ${selectedData.length} registros`, 20, 52);
    
    // Preparar dados da tabela
    const tableData = selectedData.map(item => [
      item.data,
      formatCurrency(item.valor, 'BRL'),
      formatCurrency(item.valores_originais?.vus || 0, 'BRL'),
      formatPercentage(item.porcentagens?.vus_p),
      formatCurrency(item.valores_originais?.vmad || 0, 'BRL'),
      formatPercentage(item.porcentagens?.vmad_p),
      formatCurrency(item.valores_originais?.carbono_crs || 0, 'BRL'),
      formatPercentage(item.porcentagens?.carbono_crs_p),
      formatCurrency(item.valores_originais?.agua_crs || 0, 'BRL'),
      formatPercentage(item.porcentagens?.agua_crs_p),
      item.fonte || 'N/A'
    ]);

    // Configurações da tabela
    const tableConfig = {
      head: [['Data', 'Valor Total', 'VUS', '%', 'VMAD', '%', 'Carbono', '%', 'Água', '%', 'Fonte']],
      body: tableData,
      startY: 60,
      styles: {
        fontSize: selectedData.length > 20 ? 8 : 9, // Fonte menor se muitos registros
        cellPadding: selectedData.length > 20 ? 2 : 3,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [66, 139, 202], // Azul
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { halign: 'left' },   // Data
        1: { halign: 'right' },  // Valor Total
        2: { halign: 'right' },  // VUS
        3: { halign: 'right' },  // %
        4: { halign: 'right' },  // VMAD
        5: { halign: 'right' },  // %
        6: { halign: 'right' },  // Carbono
        7: { halign: 'right' },  // %
        8: { halign: 'right' },  // Água
        9: { halign: 'right' },  // %
        10: { halign: 'left' }   // Fonte
      }
    };

    // Gerar tabela
    (doc as any).autoTable(tableConfig);
    
    // Adicionar nota no final
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('* Dados ordenados por data (mais recente primeiro)', 20, finalY + 10);
    doc.text('* Valores em Reais (BRL) - Porcentagens com 2 casas decimais', 20, finalY + 16);
    
    // Salvar PDF
    doc.save(`dados_historicos_composition_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Data', 'Valor Total', 'VUS', '%', 'VMAD', '%', 'Carbono', '%', 'Água', '%', 'Fonte'],
      ...data.map(item => [
        item.data,
        formatCurrency(item.valor, 'BRL'),
        formatCurrency(item.valores_originais?.vus || 0, 'BRL'),
        formatPercentage(item.porcentagens?.vus_p),
        formatCurrency(item.valores_originais?.vmad || 0, 'BRL'),
        formatPercentage(item.porcentagens?.vmad_p),
        formatCurrency(item.valores_originais?.carbono_crs || 0, 'BRL'),
        formatPercentage(item.porcentagens?.carbono_crs_p),
        formatCurrency(item.valores_originais?.agua_crs || 0, 'BRL'),
        formatPercentage(item.porcentagens?.agua_crs_p),
        item.fonte || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dados_historicos_composition_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dados Históricos
          </CardTitle>
          <CardDescription>
            Série histórica dos componentes do índice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dados Históricos
          </CardTitle>
          <CardDescription>
            Série histórica dos componentes do índice
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
            <div className="space-y-2">
              <p>{error || 'Nenhum dado histórico encontrado'}</p>
              <p className="text-sm">
                Tente novamente ou verifique se há dados disponíveis.
              </p>
            </div>
            <Button onClick={fetchData} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dados Históricos
            </CardTitle>
            <CardDescription>
              Série histórica dos componentes do índice ({data.length} registros)
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Seletor de quantidade para PDF */}
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">PDF:</span>
              <Select value={pdfRecordsCount.toString()} onValueChange={(value) => setPdfRecordsCount(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">registros</span>
            </div>
            
            {/* Botões de exportação */}
            <div className="flex items-center gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <TableHead className="text-left font-semibold text-gray-700 py-4 sticky left-0 bg-white border-r">Data</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Valor Total</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">VUS</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">VMAD</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Carbono</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">Água</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 py-4">Fonte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => {
                const valores = item.valores_originais || {};
                const porcentagens = item.porcentagens || {};
                
                return (
                  <TableRow 
                    key={`${item.id}-${item.data}-${index}`}
                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-green-50/30 transition-all duration-200"
                  >
                    <TableCell className="text-left font-medium text-gray-800 py-4 sticky left-0 bg-white border-r">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {item.data}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-900 font-semibold py-4">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {formatCurrency(item.valor, 'BRL')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      {formatCurrency(valores.vus || 0, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                        {formatPercentage(porcentagens.vus_p)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      {formatCurrency(valores.vmad || 0, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                        {formatPercentage(porcentagens.vmad_p)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      {formatCurrency(valores.carbono_crs || 0, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                        {formatPercentage(porcentagens.carbono_crs_p)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      {formatCurrency(valores.agua_crs || 0, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 py-4">
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-sm">
                        {formatPercentage(porcentagens.agua_crs_p)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left text-gray-600 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100">
                        {item.fonte || 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({data.length} registros)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
