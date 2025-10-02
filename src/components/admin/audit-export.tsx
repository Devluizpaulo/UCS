
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
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import type { AuditLogEntry } from './audit-history';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeAssetData: boolean;
  includeAuditLogs: boolean;
  includeCalculations: boolean;
  dateRange: 'single' | 'range' | 'month';
  startDate?: Date;
  endDate?: Date;
}

interface AuditExportProps {
  currentDate: Date;
  currentData: CommodityPriceData[];
  auditLogs: AuditLogEntry[];
}

export function AuditExport({ currentDate, currentData, auditLogs }: AuditExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeAssetData: true,
    includeAuditLogs: true,
    includeCalculations: false,
    dateRange: 'single',
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
        case 'pdf':
          await generatePDF(exportData);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async () => {
    const data: any = {
      exportDate: new Date().toISOString(),
      dateRange: {
        start: exportOptions.startDate?.toISOString(),
        end: exportOptions.endDate?.toISOString(),
        type: exportOptions.dateRange
      }
    };

    if (exportOptions.includeAssetData) {
      data.assets = currentData.map(asset => ({
        id: asset.id,
        name: asset.name,
        price: asset.price,
        currency: asset.currency,
        category: asset.category,
        sourceUrl: asset.sourceUrl,
        lastUpdated: asset.lastUpdated
      }));
    }

    if (exportOptions.includeAuditLogs) {
      data.auditLogs = auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.action,
        assetId: log.assetId,
        assetName: log.assetName,
        oldValue: log.oldValue,
        newValue: log.newValue,
        user: log.user,
        details: log.details,
        affectedAssets: log.affectedAssets
      }));
    }

    if (exportOptions.includeCalculations) {
      // Adiciona dados de cálculos e rentabilidades
      const calculatedAssets = currentData.filter(asset => 
        asset.category === 'index' || asset.category === 'sub-index'
      );
      
      data.calculations = calculatedAssets.map(asset => ({
        id: asset.id,
        name: asset.name,
        value: asset.price,
        currency: asset.currency,
        category: asset.category
      }));
    }

    return data;
  };

  const downloadCSV = (data: any) => {
    let csvContent = '';
    
    if (exportOptions.includeAssetData && data.assets) {
      csvContent += 'DADOS DOS ATIVOS\n';
      csvContent += 'ID,Nome,Valor,Moeda,Categoria,Fonte,Última Atualização\n';
      
      data.assets.forEach((asset: any) => {
        csvContent += `${asset.id},${asset.name},${asset.price},${asset.currency},${asset.category},${asset.sourceUrl || ''},${asset.lastUpdated || ''}\n`;
      });
      
      csvContent += '\n';
    }

    if (exportOptions.includeAuditLogs && data.auditLogs) {
      csvContent += 'LOGS DE AUDITORIA\n';
      csvContent += 'ID,Data/Hora,Ação,ID do Ativo,Nome do Ativo,Valor Anterior,Novo Valor,Usuário,Detalhes\n';
      
      data.auditLogs.forEach((log: any) => {
        csvContent += `${log.id},${log.timestamp},${log.action},${log.assetId},${log.assetName},${log.oldValue || ''},${log.newValue || ''},${log.user},${log.details || ''}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_${format(currentDate, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_${format(currentDate, 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async (data: any) => {
    // Para implementação futura com uma biblioteca de PDF como jsPDF
    console.log('PDF generation not implemented yet', data);
    alert('Exportação em PDF será implementada em breve. Use CSV ou JSON por enquanto.');
  };

  const setDateRange = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'today':
        setExportOptions(prev => ({
          ...prev,
          dateRange: 'single',
          startDate: today,
          endDate: today
        }));
        break;
      case 'week':
        setExportOptions(prev => ({
          ...prev,
          dateRange: 'range',
          startDate: subDays(today, 7),
          endDate: today
        }));
        break;
      case 'month':
        setExportOptions(prev => ({
          ...prev,
          dateRange: 'range',
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        }));
        break;
    }
  };

  return (
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
        {/* Formato de Exportação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Formato de Exportação</label>
          <Select
            value={exportOptions.format}
            onValueChange={(value: 'csv' | 'json' | 'pdf') =>
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
              <SelectItem value="pdf" disabled>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF (Em Breve)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conteúdo a Incluir */}
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

        {/* Período de Dados */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Período de Dados</label>
          
          <div className="flex gap-2 mb-3">
            <Button
              variant={exportOptions.dateRange === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('today')}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Última Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('month')}
            >
              Este Mês
            </Button>
          </div>

          {/* Seletores de Data Customizados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Data Inicial</label>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
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
                      "justify-start text-left font-normal",
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

        {/* Botão de Exportação */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={isExporting || (!exportOptions.includeAssetData && !exportOptions.includeAuditLogs && !exportOptions.includeCalculations)}
            className="w-full"
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
  );
}
