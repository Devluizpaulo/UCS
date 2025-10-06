
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, FileText, Table, CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CommodityPriceData } from '@/lib/types';
import type { AuditLogEntry } from './audit-history';
import { getCommodityPricesByDate } from '@/lib/data-service';
import { getAuditLogsForPeriod } from '@/lib/audit-log-service';
import { PdfExportButton } from '@/components/pdf-export-button';
import type { DashboardPdfData } from '@/lib/types';

interface ExportOptions {
  format: 'csv' | 'json';
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
    format: 'csv',
    includeAssetData: true,
    includeAuditLogs: true,
    includeCalculations: false,
    startDate: currentDate,
    endDate: currentDate
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = await generateExportData();
      
      switch (exportOptions.format) {
        case 'csv':
          downloadCSV(exportData);
          break;
        case 'json':
          downloadJSON(exportData);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Ocorreu um erro durante a exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async () => {
    const { startDate, endDate } = exportOptions;
    if (!startDate || !endDate) return {};

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
      
      const pricePromises = dateArray.map(date => getCommodityPricesByDate(date));
      const pricesByDate = await Promise.all(pricePromises);
      
      if (exportOptions.includeAssetData) {
        data.asset_data = pricesByDate.flat();
      }
      if (exportOptions.includeCalculations) {
        data.calculated_indices = pricesByDate.flat().filter(
          asset => asset.category === 'index' || asset.category === 'sub-index' || asset.category === 'main-index'
        );
      }
    }

    if (exportOptions.includeAuditLogs) {
      data.audit_logs = await getAuditLogsForPeriod(startDate, endDate);
    }

    return data;
  };

  const downloadCSV = (data: any) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
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
        csvContent += `${log.timestamp.toISOString()},${log.action},${log.assetId},"${log.assetName}",${log.oldValue || ''},${log.newValue || ''},"${log.user}","${log.details || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
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
              onValueChange={(value: 'csv' | 'json') =>
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Excel/Planilhas)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON (Dados Estruturados)
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset('week')}
              >
                Última Semana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset('month')}
              >
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
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportOptions.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportOptions.startDate ? (
                        format(exportOptions.startDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.startDate}
                      onSelect={(date) => {
                        setExportOptions(prev => ({ ...prev, startDate: date }));
                        setIsStartCalendarOpen(false);
                      }}
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
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportOptions.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportOptions.endDate ? (
                        format(exportOptions.endDate, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        "Selecione"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.endDate}
                      onSelect={(date) => {
                        setExportOptions(prev => ({ ...prev, endDate: date }));
                        setIsEndCalendarOpen(false);
                      }}
                      disabled={(date) => 
                        date > new Date() || 
                        (!!exportOptions.startDate && date < exportOptions.startDate)
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row gap-2">
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
            <PdfExportButton
              data={{
                  targetDate: currentDate,
                  mainIndex: undefined,
                  secondaryIndices: [],
                  currencies: [],
                  otherAssets: [],
              }}
              reportType="audit"
              disabled={isExporting}
            >
              Exportar Resumo (PDF)
            </PdfExportButton>
            
            {!exportOptions.includeAssetData && !exportOptions.includeAuditLogs && !exportOptions.includeCalculations && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Selecione pelo menos um tipo de conteúdo para exportar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
