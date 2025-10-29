'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Download, FileText, Filter, Search, CheckSquare, Square } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Legend as ReLegend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBrazilHolidays } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ASSET_DEPENDENCIES, type AssetDependency } from '@/lib/dependency-service';


interface ComparisonData {
  assetId: string;
  assetName: string;
  currentValue: number;
  compareValue: number;
  absoluteChange: number;
  percentageChange: number;
  currency: string;
  type: AssetDependency['calculationType'];
}

interface DateComparisonProps {
  currentDate: Date;
  currentData: CommodityPriceData[];
}

function getTrendIcon(percentageChange: number) {
  if (percentageChange > 0.01) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else if (percentageChange < -0.01) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function getTrendBadge(percentageChange: number) {
  if (percentageChange > 5) {
    return <Badge variant="default" className="bg-green-100 text-green-800">Alta Significativa</Badge>;
  } else if (percentageChange > 0.01) {
    return <Badge variant="outline" className="text-green-700">Alta</Badge>;
  } else if (percentageChange < -5) {
    return <Badge variant="destructive">Queda Significativa</Badge>;
  } else if (percentageChange < -0.01) {
    return <Badge variant="outline" className="text-red-700">Queda</Badge>;
  } else {
    return <Badge variant="secondary">Estável</Badge>;
  }
}

// Estende a interface do jsPDF para incluir o autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export function DateComparison({ currentDate, currentData }: DateComparisonProps) {
  const BR_HOLIDAYS_2025 = getBrazilHolidays(2025)
  const [compareDate, setCompareDate] = useState<Date | undefined>();
  const [compareData, setCompareData] = useState<CommodityPriceData[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const comparisonContentRef = useRef<HTMLDivElement>(null);
  // Filtros
  const [search, setSearch] = useState('');
  const allTypes: AssetDependency['calculationType'][] = ['base','calculated','index','credit','main-index','sub-index'];
  const [enabledTypes, setEnabledTypes] = useState<Record<AssetDependency['calculationType'], boolean>>({
    base: true,
    calculated: true,
    index: true,
    credit: true,
    'main-index': true,
    'sub-index': true,
  });
  const [selectedAssets, setSelectedAssets] = useState<Record<string, boolean>>({});
  // Ordenação
  const [sortBy, setSortBy] = useState<'name'|'current'|'compare'|'abs'|'pct'>('pct');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  // Gráficos
  const [chartView, setChartView] = useState<'percent'|'values'>('percent');
  const [radarMode, setRadarMode] = useState<'index100'|'percent'>('index100');
  const [radarTopN, setRadarTopN] = useState<number>(8);


  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    setCompareDate(date);
    setIsCalendarOpen(false);
    setIsLoading(true);

    try {
      const data = await getCommodityPricesByDate(date);
      setCompareData(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setCompareData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (compareData.length > 0 && currentData.length > 0) {
      const results: ComparisonData[] = [];
      
      const compareMap = new Map(compareData.map(item => [item.id, item]));
      
      currentData.forEach(currentAsset => {
        const compareAsset = compareMap.get(currentAsset.id);
        const assetInfo = ASSET_DEPENDENCIES[currentAsset.id];
        
        if (compareAsset && assetInfo) {
          const absoluteChange = currentAsset.price - compareAsset.price;
          const percentageChange = compareAsset.price !== 0 
            ? (absoluteChange / compareAsset.price) * 100 
            : (currentAsset.price !== 0 ? 100 : 0);

          results.push({
            assetId: currentAsset.id,
            assetName: currentAsset.name,
            currentValue: currentAsset.price,
            compareValue: compareAsset.price,
            absoluteChange,
            percentageChange,
            currency: currentAsset.currency,
            type: assetInfo.calculationType
          });
        }
      });

      results.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
      
      setComparisonResults(results);
    } else {
      setComparisonResults([]);
    }
  }, [currentData, compareData]);

  // Aplica filtros e busca
  const visibleResults = useMemo(() => {
    const filterText = search.trim().toLowerCase();
    const selectedIds = new Set(Object.entries(selectedAssets).filter(([,v]) => v).map(([k]) => k));
    return comparisonResults.filter(r => {
      if (!enabledTypes[r.type]) return false;
      if (selectedIds.size > 0 && !selectedIds.has(r.assetId)) return false;
      if (filterText) {
        const hay = (r.assetName + ' ' + r.assetId).toLowerCase();
        if (!hay.includes(filterText)) return false;
      }
      return true;
    });
  }, [comparisonResults, enabledTypes, selectedAssets, search]);

  const sortedVisibleResults = useMemo(() => {
    const arr = [...visibleResults];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.assetName.localeCompare(b.assetName) * dir;
        case 'current': return (a.currentValue - b.currentValue) * dir;
        case 'compare': return (a.compareValue - b.compareValue) * dir;
        case 'abs': return (a.absoluteChange - b.absoluteChange) * dir;
        case 'pct': default: return (a.percentageChange - b.percentageChange) * dir;
      }
    });
    return arr;
  }, [visibleResults, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'name' ? 'asc' : 'desc');
    }
  };
  
  const handleExportExcel = async () => {
    if (visibleResults.length === 0 || !compareDate) return;
    
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comparação de Datas');
      
      const currentDateFormatted = format(currentDate, 'dd/MM/yyyy');
      const compareDateFormatted = format(compareDate, 'dd/MM/yyyy');

      // Título
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Relatório Comparativo de Ativos';
      titleCell.font = { name: 'Calibri', size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Subtítulo
      worksheet.mergeCells('A2:E2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = `Período: ${compareDateFormatted} vs ${currentDateFormatted}`;
      subtitleCell.font = { name: 'Calibri', size: 12 };
      subtitleCell.alignment = { horizontal: 'center' };
      
      worksheet.addRow([]); // Linha em branco

      // Cabeçalhos
      const headerRow = worksheet.addRow([
        'Ativo',
        `Valor (${currentDateFormatted})`,
        `Valor (${compareDateFormatted})`,
        'Variação Absoluta',
        'Variação (%)',
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0070F3' } // Azul
        };
        cell.alignment = { horizontal: 'center' };
      });
      
      // Dados
      visibleResults.forEach(item => {
        const row = worksheet.addRow([
          item.assetName,
          item.currentValue,
          item.compareValue,
          item.absoluteChange,
          item.percentageChange / 100
        ]);

        // Formatação de moeda
        row.getCell(2).numFmt = `"${item.currency}" #,##0.00`;
        row.getCell(3).numFmt = `"${item.currency}" #,##0.00`;
        row.getCell(4).numFmt = `"${item.currency}" #,##0.00`;
        // Formatação de porcentagem
        row.getCell(5).numFmt = '0.00%';
        
        // Colore a variação
        if (item.percentageChange > 0) {
            row.getCell(5).font = { color: { argb: 'FF008000' } }; // Verde
        } else if (item.percentageChange < 0) {
            row.getCell(5).font = { color: { argb: 'FFFF0000' } }; // Vermelho
        }
      });
      
      // Ajuste de largura das colunas
      worksheet.columns.forEach(column => {
        if (column.values) {
          let maxLength = 0;
          column.values.forEach(value => {
            if (value) {
                const columnLength = value.toString().length;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            }
          });
          column.width = maxLength < 15 ? 15 : maxLength + 2;
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comparacao_${format(currentDate, 'yyyy-MM-dd')}_vs_${format(compareDate, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (visibleResults.length === 0 || !compareDate) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const currentDateFormatted = format(currentDate, 'dd/MM/yyyy');
      const compareDateFormatted = format(compareDate, 'dd/MM/yyyy');
      const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

      // --- Cabeçalho do Documento ---
      doc.setFontSize(18);
      doc.setTextColor(34, 47, 62); // Cor escura (quase preto)
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Comparativo de Ativos', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 122, 137); // Cinza
      doc.text(`Análise do período de ${compareDateFormatted} a ${currentDateFormatted}`, doc.internal.pageSize.getWidth() / 2, 29, { align: 'center' });
      doc.text(`Gerado em: ${generationDate}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      // Separa os ativos
      const baseAssets = visibleResults.filter(r => r.type === 'base');
      const calculatedAssets = visibleResults.filter(r => r.type !== 'base');

      // --- Função para gerar tabela ---
      const generateTable = (title: string, subtitle: string, data: ComparisonData[], startY: number, headerColor: [number, number, number]): number => {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 47, 62);
          doc.text(title, 14, startY);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(108, 122, 137);
          doc.text(subtitle, 14, startY + 5);

          const tableColumn = ["Ativo", `Valor (${compareDateFormatted})`, `Valor (${currentDateFormatted})`, "Variação Absoluta", "Variação (%)"];
          const tableRows = data.map(item => [
              item.assetName,
              formatCurrency(item.compareValue, item.currency, item.assetId),
              formatCurrency(item.currentValue, item.currency, item.assetId),
              `${item.absoluteChange >= 0 ? '+' : ''}${formatCurrency(item.absoluteChange, item.currency, item.assetId)}`,
              `${item.percentageChange >= 0 ? '+' : ''}${item.percentageChange.toFixed(2)}%`
          ]);

          doc.autoTable({
              startY: startY + 10,
              head: [tableColumn],
              body: tableRows,
              theme: 'grid',
              headStyles: { fillColor: headerColor, textColor: 255, fontStyle: 'bold' },
              didDrawCell: (data: any) => {
                  if (data.section === 'body' && data.column.index === 4) { // Coluna de Variação %
                      const text = data.cell.text[0];
                      if (text.includes('+')) {
                          doc.setTextColor(39, 174, 96); // Verde
                          doc.setFont('helvetica', 'bold');
                      } else if (text.includes('-')) {
                          doc.setTextColor(192, 57, 43); // Vermelho
                          doc.setFont('helvetica', 'bold');
                      }
                  }
              },
          });
          return (doc as any).lastAutoTable.finalY;
      };

      // --- Gera as seções ---
      let finalY = generateTable('Ativos Base', 'Valores de mercado que servem como entrada para os cálculos.', baseAssets, 50, [44, 62, 80]); // Azul escuro
      finalY = generateTable('Índices Calculados', 'Resultados dos índices e sub-índices da plataforma.', calculatedAssets, finalY + 15, [22, 160, 133]); // Verde-azulado

      // --- Rodapé ---
      const pageCount = doc.internal.pages.length;
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

      doc.save(`relatorio_comparativo_${format(currentDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const daysDifference = compareDate ? Math.abs(differenceInDays(currentDate, compareDate)) : 0;
  const availableAssets = useMemo(() => {
    const m = new Map<string, string>();
    comparisonResults.forEach(r => m.set(r.assetId, r.assetName));
    return Array.from(m).map(([id, name]) => ({ id, name }));
  }, [comparisonResults]);
  const maxVariation = visibleResults.length ? Math.max(...visibleResults.map(r => Math.abs(r.percentageChange))) : 0;
  const avgVariation = visibleResults.length ? (visibleResults.reduce((s, r) => s + r.percentageChange, 0) / visibleResults.length) : 0;
  const toggleType = (t: AssetDependency['calculationType']) => setEnabledTypes(prev => ({ ...prev, [t]: !prev[t] }));
  const toggleAsset = (id: string) => setSelectedAssets(prev => ({ ...prev, [id]: !prev[id] }));
  const clearFilters = () => { setSelectedAssets({}); setSearch(''); setEnabledTypes({ base:true, calculated:true, index:true, credit:true, 'main-index':true, 'sub-index':true }); };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparação entre Datas
              </CardTitle>
              <CardDescription>
                Compare os valores dos ativos entre diferentes datas para análise de variações.
              </CardDescription>
            </div>
             {comparisonResults.length > 0 && (
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportExcel} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar (XLSX)
                    </Button>
                    <Button onClick={handleExportPdf} disabled={isExporting} variant="outline" size="sm">
                        {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                        Exportar (PDF)
                    </Button>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Data Atual:</span>
            <Badge variant="outline">
              {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Comparar com:</span>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !compareDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {compareDate ? (
                    format(compareDate, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={compareDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date.getTime() === currentDate.getTime()}
                  initialFocus
                  locale={ptBR}
                  blockFuture
                  blockWeekends
                  holidays={BR_HOLIDAYS_2025}
                />
              </PopoverContent>
            </Popover>
          </div>

          {compareDate && (
            <Badge variant="secondary" className="text-xs">
              {daysDifference} dia{daysDifference !== 1 ? 's' : ''} de diferença
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Button variant="outline" size="sm" onClick={() => { setEnabledTypes({ base:true, calculated:false, index:false, credit:false, 'main-index':false, 'sub-index':false }); setSelectedAssets({}); }} title="Apenas ativos base">
                Individuais
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEnabledTypes({ base:false, calculated:true, index:true, credit:true, 'main-index':true, 'sub-index':true }); setSelectedAssets({}); }} title="Ativos calculados e índices">
                Coletivos
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEnabledTypes({ base:true, calculated:true, index:true, credit:true, 'main-index':true, 'sub-index':true }); }} title="Mostrar todos">
                Todos
              </Button>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="pl-8 pr-3 py-1.5 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Buscar ativo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tipos</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allTypes.map(t => (
                      <button key={t} onClick={() => toggleType(t)} className={cn('flex items-center gap-2 px-2 py-1.5 rounded border text-xs', enabledTypes[t] ? 'bg-primary/5 border-primary/30' : 'bg-muted/40')}> 
                        {enabledTypes[t] ? <CheckSquare className="h-3.5 w-3.5"/> : <Square className="h-3.5 w-3.5"/>}
                        <span className="capitalize">{t.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Ativos</div>
                    <div className="max-h-52 overflow-auto space-y-1 pr-1">
                      {availableAssets.map(a => (
                        <button key={a.id} onClick={() => toggleAsset(a.id)} className={cn('w-full flex items-center justify-between text-left text-xs px-2 py-1.5 rounded border', selectedAssets[a.id] ? 'bg-primary/5 border-primary/30' : 'bg-muted/40')}>
                          <span className="truncate">{a.name}</span>
                          {selectedAssets[a.id] ? <CheckSquare className="h-3.5 w-3.5"/> : <Square className="h-3.5 w-3.5"/>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Lista fixa de seleção de ativos */}
        {comparisonResults.length > 0 && (
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Selecionar Ativos</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    availableAssets.forEach(a => { all[a.id] = true; });
                    setSelectedAssets(all);
                  }}
                >Selecionar todos</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAssets({})}>Limpar seleção</Button>
              </div>
            </div>
            <ScrollArea className="h-40 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableAssets.map(a => (
                  <button
                    key={a.id}
                    onClick={() => toggleAsset(a.id)}
                    className={cn('flex items-center justify-between px-2 py-1.5 rounded border text-xs', selectedAssets[a.id] ? 'bg-primary/5 border-primary/30' : 'bg-muted/40')}
                    title={a.id}
                  >
                    <span className="truncate mr-2">{a.name}</span>
                    {selectedAssets[a.id] ? <CheckSquare className="h-3.5 w-3.5"/> : <Square className="h-3.5 w-3.5"/>}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando dados de comparação...
            </span>
          </div>
        )}
        <div ref={comparisonContentRef}>
            {visibleResults.length > 0 && !isLoading && (
            <div className="space-y-4">
                {/* Gráficos comparativos */}
                {visibleResults.length > 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Variação (%) por ativo */}
                    <Card>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Variação (%) por Ativo</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant={chartView==='percent'?'default':'outline'} onClick={()=>setChartView('percent')}>% Variação</Button>
                            <Button size="sm" variant={chartView==='values'?'default':'outline'} onClick={()=>setChartView('values')}>Valores</Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'percent' ? (
                              <BarChart data={sortedVisibleResults.slice(0, 15).map(r => ({ name: r.assetName, pct: Number(r.percentageChange.toFixed(2)) }))} margin={{ left: 8, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" hide />
                                <YAxis tickFormatter={(v)=>`${v}%`} width={40} />
                                <ReTooltip formatter={(v: any)=>`${v}%`} />
                                <Bar dataKey="pct" fill="#3b82f6" radius={[4,4,0,0]} />
                              </BarChart>
                            ) : (
                              <BarChart data={sortedVisibleResults.slice(0, 12).map(r => ({ name: r.assetName, atual: r.currentValue, anterior: r.compareValue, currency: r.currency, id: r.assetId }))}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={50} />
                                <YAxis width={70} />
                                <ReTooltip formatter={(v: any, _n:any, obj:any)=>formatCurrency(v, obj.payload.currency, obj.payload.id)} />
                                <ReLegend />
                                <Bar dataKey="anterior" name="Valor Anterior" fill="#94a3b8" radius={[4,4,0,0]} />
                                <Bar dataKey="atual" name="Valor Atual" fill="#22c55e" radius={[4,4,0,0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ranking por variação absoluta */}
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Ranking por Variação Absoluta</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedVisibleResults.slice(0, 15).map(r => ({ name: r.assetName, abs: Number(r.absoluteChange.toFixed(2)), currency: r.currency, id: r.assetId }))} layout="vertical" margin={{ left: 16, right: 16 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" width={120} />
                              <ReTooltip formatter={(v: any, _n:any, obj:any)=>formatCurrency(v, obj.payload.currency, obj.payload.id)} />
                              <Bar dataKey="abs" fill="#f97316" radius={[0,4,4,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {/* Radar comparativo */}
                {compareDate && visibleResults.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Radar Comparativo por Ativo</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant={radarMode==='index100'?'default':'outline'} onClick={()=>setRadarMode('index100')}>Idx100</Button>
                          <Button size="sm" variant={radarMode==='percent'?'default':'outline'} onClick={()=>setRadarMode('percent')}>%</Button>
                          <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                            <span>Top</span>
                            <input type="range" min={3} max={Math.min(12, visibleResults.length)} value={Math.min(radarTopN, Math.min(12, visibleResults.length))} onChange={(e)=>setRadarTopN(Number(e.target.value))} />
                            <Badge variant="outline">{Math.min(radarTopN, Math.min(12, visibleResults.length))}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={140} data={sortedVisibleResults.slice(0, Math.min(12, radarTopN)).map(r => {
                            const idx = r.compareValue ? (r.currentValue / r.compareValue) * 100 : 100;
                            const pct = Number((r.percentageChange ?? 0).toFixed(2));
                            const name = r.assetName.length > 18 ? r.assetName.slice(0, 16) + '…' : r.assetName;
                            return { name, base: 100, idx: Number(idx.toFixed(2)), pct: Number(isFinite(pct) ? pct : 0) };
                          })}>
                            <defs>
                              <radialGradient id="radarGradientIdx" cx="50%" cy="50%" r="65%">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
                                <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
                              </radialGradient>
                              <radialGradient id="radarGradientPct" cx="50%" cy="50%" r="65%">
                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.55} />
                                <stop offset="60%" stopColor="#a78bfa" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#f472b6" stopOpacity={0.35} />
                              </radialGradient>
                            </defs>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={radarMode==='index100' ? [50, 150] : ['auto','auto']} tickFormatter={(v)=> radarMode==='index100' ? `${v}` : `${v}%`} />
                            {radarMode==='index100' ? (
                              <>
                                <Radar name="Anterior (base 100)" dataKey="base" stroke="#94a3b8" strokeDasharray="4 4" fill="#cbd5e1" fillOpacity={0.18} />
                                <Radar name="Atual (idx100)" dataKey="idx" stroke="#10b981" strokeWidth={2} fill="url(#radarGradientIdx)" />
                              </>
                            ) : (
                              <Radar name="Variação %" dataKey="pct" stroke="#3b82f6" strokeWidth={2} fill="url(#radarGradientPct)" />
                            )}
                            <ReLegend />
                            <ReTooltip formatter={(v:any, n:any) => radarMode==='index100' ? `${Number(v).toFixed(1)}` : `${Number(v).toFixed(2)}%`} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                    <div className="font-semibold text-lg text-green-600">
                    {visibleResults.filter(r => r.percentageChange > 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativos em Alta</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg text-red-600">
                    {visibleResults.filter(r => r.percentageChange < 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativos em Queda</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg text-blue-600">
                    {maxVariation.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Maior Variação</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-lg">
                    {avgVariation.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Variação Média</div>
                </div>
                </div>

                <ScrollArea className="h-[400px]">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>Ativo {sortBy==='name' ? (sortDir==='asc'?'↑':'↓'):''}</TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => toggleSort('current')}>Valor Atual {sortBy==='current' ? (sortDir==='asc'?'↑':'↓'):''}</TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => toggleSort('compare')}>Valor Anterior {sortBy==='compare' ? (sortDir==='asc'?'↑':'↓'):''}</TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => toggleSort('pct')}>Variação {sortBy==='pct' ? (sortDir==='asc'?'↑':'↓'):''}</TableHead>
                        <TableHead className="text-center">Tendência</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {sortedVisibleResults.map((result) => (
                        <TableRow key={result.assetId} className={cn('hover:bg-muted/40', result.percentageChange > 0.01 && 'border-l-4 border-green-500', result.percentageChange < -0.01 && 'border-l-4 border-red-500')}>
                        <TableCell className="font-medium">
                            {result.assetName}
                            <div className="text-xs text-muted-foreground">
                            {result.assetId}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {formatCurrency(result.currentValue, result.currency, result.assetId)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                            {formatCurrency(result.compareValue, result.currency, result.assetId)}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="space-y-1">
                            <div className={cn(
                                "font-mono text-sm",
                                result.percentageChange > 0.01 && "text-green-600",
                                result.percentageChange < -0.01 && "text-red-600"
                            )}>
                                {result.percentageChange > 0 ? '+' : ''}{result.percentageChange.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {result.absoluteChange > 0 ? '+' : ''}{formatCurrency(result.absoluteChange, result.currency, result.assetId)}
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                            {getTrendIcon(result.percentageChange)}
                            {getTrendBadge(result.percentageChange)}
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </ScrollArea>
            </div>
            )}

            {comparisonResults.length > 0 && visibleResults.length === 0 && !isLoading && (
              <div className="text-center text-sm text-muted-foreground p-8">
                <p>Nenhum ativo corresponde aos filtros atuais.</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedAssets({})}>Limpar seleção</Button>
                  <Button size="sm" variant="outline" onClick={() => setEnabledTypes({ base:true, calculated:true, index:true, credit:true, 'main-index':true, 'sub-index':true })}>Mostrar todos os tipos</Button>
                </div>
              </div>
            )}
        </div>

        {!compareDate && (
          <div className="text-center text-sm text-muted-foreground p-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Selecione uma data para comparar com os dados atuais.</p>
            <p className="text-xs mt-2">A comparação mostrará as variações entre as duas datas.</p>
          </div>
        )}

        {compareDate && comparisonResults.length === 0 && !isLoading && (
          <div className="text-center text-sm text-muted-foreground p-8">
            <p>Não foram encontrados dados para comparação na data selecionada.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    

    
