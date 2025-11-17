
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, FileText, Table, CalendarIcon, Loader2, Settings, FileSpreadsheet } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CommodityPriceData } from '@/lib/types';
import type { AuditLogEntry } from './audit-history';
import { getCommodityPricesByDate } from '@/lib/data-service';
import { getAuditLogsForPeriod } from '@/lib/audit-log-service';
import { PdfPreviewModal } from '@/components/pdf-preview-modal';
import type { DashboardPdfData } from '@/lib/types';
import * as XLSX from 'xlsx';

interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json' | 'pdf';
  includeAssetData: boolean;
  includeAuditLogs: boolean;
  includeCalculations: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface AuditExportProps {
  currentDate: Date;
}

export function AuditExport({ currentDate }: AuditExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeAssetData: true,
    includeAuditLogs: true,
    includeCalculations: false,
    startDate: currentDate,
    endDate: currentDate
  });
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<DashboardPdfData | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [pdfRecordsCount, setPdfRecordsCount] = React.useState<number | string>(10);
  const [excelRecordsCount, setExcelRecordsCount] = React.useState<number | string>(100);
  
  const handleExport = async () => {
    if (exportOptions.format === 'pdf') {
      const dataForPdf = await generateExportData(10); // Limite para PDF ou use um seletor
      setPdfData({
        targetDate: exportOptions.startDate || new Date(),
        mainIndex: dataForPdf.asset_data?.find(a => a.id === 'ucs_ase'),
        secondaryIndices: dataForPdf.asset_data?.filter(a => ['pdm', 'vus'].includes(a.id)) || [],
        currencies: dataForPdf.asset_data?.filter(a => ['usd', 'eur'].includes(a.id)) || [],
        otherAssets: dataForPdf.asset_data?.filter(a => !['ucs_ase', 'pdm', 'vus', 'usd', 'eur'].includes(a.id)) || [],
        // Inclua logs de auditoria se precisar exibi-los no PDF de alguma forma
      });
      setIsPdfPreviewOpen(true);
      return;
    }
    
    setIsExporting(true);
    
    try {
      const exportData = await generateExportData(exportOptions.format === 'csv' || exportOptions.format === 'xlsx' ? excelRecordsCount : undefined);
      
      switch (exportOptions.format) {
        case 'csv':
          downloadCSV(exportData);
          break;
        case 'json':
          downloadJSON(exportData);
          break;
        case 'xlsx':
          downloadXLSX(exportData);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Ocorreu um erro durante a exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async (limit?: number | string) => {
    const { startDate, endDate } = exportOptions;
    if (!startDate || !endDate) return {};

    const numLimit = typeof limit === 'number' ? limit : undefined;

    const data: any = {
      exportDate: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }
    };

    if (exportOptions.includeAssetData || exportOptions.includeCalculations) {
      const dateArray: Date[] = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const pricePromises = dateArray.map(date => getRawCommodityPricesByDate(date));
      const pricesByDate = await Promise.all(pricePromises);
      
      const flatPrices = pricesByDate.flat();

      if (exportOptions.includeAssetData) {
        data.asset_data = numLimit ? flatPrices.slice(0, numLimit) : flatPrices;
      }
      if (exportOptions.includeCalculations) {
        const calculated = flatPrices.filter(
          asset => asset.category === 'index' || asset.category === 'sub-index' || asset.category === 'main-index'
        );
        data.calculated_indices = numLimit ? calculated.slice(0, numLimit) : calculated;
      }
    }

    if (exportOptions.includeAuditLogs) {
      data.audit_logs = await getAuditLogsForPeriod(startDate, endDate);
      if (numLimit) data.audit_logs = data.audit_logs.slice(0, numLimit);
    }

    return data;
  };

  const downloadXLSX = (data: any) => {
    const wb = XLSX.utils.book_new();

    if (exportOptions.includeAssetData && data.asset_data) {
        const wsData = [
            ['Data', 'ID', 'Nome', 'Valor', 'Moeda', 'Categoria'],
            ...data.asset_data.map((asset: CommodityPriceData) => [
                asset.lastUpdated, asset.id, asset.name, asset.price, asset.currency, asset.category
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dados de Ativos');
    }

    if (exportOptions.includeAuditLogs && data.audit_logs) {
        const wsData = [
            ['Data/Hora', 'Ação', 'ID Ativo', 'Nome Ativo', 'Valor Antigo', 'Valor Novo', 'Usuário', 'Detalhes'],
            ...data.audit_logs.map((log: AuditLogEntry) => [
                log.timestamp.toISOString(), log.action, log.assetId, log.assetName, log.oldValue ?? '', log.newValue ?? '', log.user, log.details ?? ''
            ])
        ];
        const ws = XLSX-utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Logs de Auditoria');
    }

    if (exportOptions.includeCalculations && data.calculated_indices) {
        const wsData = [
            ['Data', 'ID', 'Nome', 'Valor', 'Moeda'],
            ...data.calculated_indices.map((asset: CommodityPriceData) => [
                asset.lastUpdated, asset.id, asset.name, asset.price, asset.currency
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Índices Calculados');
    }

    XLSX.writeFile(wb, `auditoria_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const downloadCSV = (data: any) => {
    let csvContent = '';
    
    if (exportOptions.includeAssetData && data.asset_data) {
      csvContent += 'DADOS DOS ATIVOS\n';
      csvContent += 'Data,ID,Nome,Valor,Moeda,Categoria\n';
      data.asset_data.forEach((asset: CommodityPriceData) => {
        csvContent += `${asset.lastUpdated},${asset.id},"${asset.name}",${asset.price},${asset.currency},${asset.category}\n`;
      });
      csvContent += '\n';
    }

    if (exportOptions.includeAuditLogs && data.audit_logs) {
      csvContent += 'LOGS DE AUDITORIA\n';
      csvContent += 'Data/Hora,Ação,ID do Ativo,Nome do Ativo,Valor Anterior,Novo Valor,Usuário,Detalhes\n';
      data.audit_logs.forEach((log: AuditLogEntry) => {
        csvContent += `${log.timestamp.toISOString()},${log.action},${log.assetId},"${log.assetName}",${log.oldValue ?? ''},${log.newValue ?? ''},"${log.user}","${log.details || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data: any) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `auditoria_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    link.remove();
  };

  const setDateRangePreset = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    let start = today;
    
    switch (range) {
      case 'week':
        start = subDays(today, 7);
        break;
      case 'month':
        start = startOfMonth(today);
        break;
    }
    
    setExportOptions(prev => ({
      ...prev,
      startDate: start,
      endDate: today
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados de Auditoria
          </CardTitle>
          <CardDescription>
            Exporte dados de auditoria e ativos em diferentes formatos para análise externa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato de Exportação</label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'xlsx' | 'csv' | 'json' | 'pdf') =>
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    XLSX (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Planilhas)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON (Dados Estruturados)
                  </div>
                </SelectItem>
                 <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF (Resumo)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Conteúdo a Incluir</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAssetData"
                  checked={exportOptions.includeAssetData}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeAssetData: !!checked }))
                  }
                />
                <label htmlFor="includeAssetData" className="text-sm">
                  Dados dos Ativos (preços, moedas, categorias)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAuditLogs"
                  checked={exportOptions.includeAuditLogs}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeAuditLogs: !!checked }))
                  }
                />
                <label htmlFor="includeAuditLogs" className="text-sm">
                  Logs de Auditoria (alterações, recálculos)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCalculations"
                  checked={exportOptions.includeCalculations}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeCalculations: !!checked }))
                  }
                />
                <label htmlFor="includeCalculations" className="text-sm">
                  Índices Calculados (VUS, VMAD, UCS, etc.)
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Período de Dados</label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={format(currentDate, 'yyyy-MM-dd') === format(exportOptions.startDate || new Date(), 'yyyy-MM-dd') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRangePreset('today')}
              >
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDateRangePreset('week')}>
                Última Semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDateRangePreset('month')}>
                Este Mês
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Data Inicial</label>
                <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !exportOptions.startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportOptions.startDate ? format(exportOptions.startDate, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.startDate}
                      onSelect={(date) => { setExportOptions(prev => ({ ...prev, startDate: date })); setIsStartCalendarOpen(false); }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Data Final</label>
                <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !exportOptions.endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportOptions.endDate ? format(exportOptions.endDate, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.endDate}
                      onSelect={(date) => { setExportOptions(prev => ({ ...prev, endDate: date })); setIsEndCalendarOpen(false); }}
                      disabled={(date) => date > new Date() || (!!exportOptions.startDate && date < exportOptions.startDate)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pdf-records" className="text-sm font-medium">Registros (PDF)</label>
                    <Select value={String(pdfRecordsCount)} onValueChange={v => setPdfRecordsCount(v === 'all' ? 'all' : Number(v))}>
                        <SelectTrigger id="pdf-records"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100, 'all'].map(v => <SelectItem key={v} value={String(v)}>{v === 'all' ? 'Todos' : v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="excel-records" className="text-sm font-medium">Registros (Excel/CSV)</label>
                     <Select value={String(excelRecordsCount)} onValueChange={v => setExcelRecordsCount(v === 'all' ? 'all' : Number(v))}>
                        <SelectTrigger id="excel-records"><SelectValue /></SelectTrigger>
                        <SelectContent>
                             {[50, 100, 500, 1000, 'all'].map(v => <SelectItem key={v} value={String(v)}>{v === 'all' ? 'Todos' : v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleExport}
              disabled={isExporting || (!exportOptions.includeAssetData && !exportOptions.includeAuditLogs && !exportOptions.includeCalculations)}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados
                </>
              )}
            </Button>
            {!exportOptions.includeAssetData && !exportOptions.includeAuditLogs && !exportOptions.includeCalculations && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Selecione pelo menos um tipo de conteúdo para exportar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {pdfData && (
        <PdfPreviewModal
          isOpen={isPdfPreviewOpen}
          onOpenChange={setIsPdfPreviewOpen}
          reportType="audit"
          data={pdfData}
        />
      )}
    </>
  );
}
