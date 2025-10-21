'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompositionDataWithComponents } from '@/lib/data-service';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, PieChart as PieChartIcon, AlertTriangle, RefreshCw, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicCompositionChart } from '@/components/charts/dynamic-composition-chart';
import { ChartTypeSelector, ChartType } from '@/components/charts/chart-type-selector';
import { HistoricalCompositionTable } from '@/components/historical-composition-table';
import { getComponentColor } from '@/lib/colors';

interface CompositionAnalysisProps {
  targetDate: Date;
}

// Mapeamento fixo dos componentes - nomes sempre corretos
const FIXED_COMPONENT_NAMES: Record<string, string> = {
  vus: 'VUS (Valor de Uso do Solo)',
  vmad: 'VMAD (Valor da Madeira)',
  carbono_crs: 'Carbono CRS',
  agua_crs: 'Agua CRS',
  crs_total: 'CRS (Custo de Resp. Socioambiental)'
};

// Função para obter nome fixo do componente
const getFixedComponentName = (componentId: string): string => {
  return FIXED_COMPONENT_NAMES[componentId] || componentId;
};

// Função para formatar porcentagens de forma consistente
const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export function CompositionAnalysis({ targetDate }: CompositionAnalysisProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('pie');

  const exportChartToPDF = async () => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Título principal
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Analise de Composicao - Valor de Uso do Solo', 20, 30);
      
      // Data e valor total
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Data: ${data?.data || 'N/A'}`, 20, 45);
      doc.text(`Valor Total: ${formatCurrency(data?.valor || 0, 'BRL')}`, 20, 55);
      
      // Capturar o gráfico
      const chartElement = document.getElementById('composition-chart');
      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 160; // Largura da imagem
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Adicionar o gráfico
        doc.addImage(imgData, 'PNG', 20, 70, imgWidth, imgHeight);
      }
      
      // Preparar dados da tabela de valores detalhados
      const tableRows: string[][] = [];
      
      console.log('🔍 [PDF Export] Processing tableData:', tableData);
      
      // Verificar se temos dados válidos
      if (!tableData || tableData.length === 0) {
        console.error('❌ [PDF Export] No tableData available');
        return;
      }
      
      // Validar estrutura dos dados
      const validTableData = tableData.filter(item => {
        const isValid = item && 
                       item.id && 
                       typeof item.value === 'number' && 
                       typeof item.percentage === 'number' &&
                       !isNaN(item.value) &&
                       !isNaN(item.percentage);
        
        if (!isValid) {
          console.warn('⚠️ [PDF Export] Invalid tableData item:', item);
        }
        
        return isValid;
      });
      
      console.log('🔍 [PDF Export] Valid tableData items:', validTableData.length);
      
      // Adicionar componentes principais (não sub-componentes)
      const mainComponents = validTableData.filter(item => !item.isSub);
      console.log('🔍 [PDF Export] Main components:', mainComponents);
      
      mainComponents.forEach(item => {
        // Validar dados antes de adicionar
        if (item.id && typeof item.value === 'number' && typeof item.percentage === 'number') {
          // Usar nome fixo do componente baseado no ID
          const fixedName = getFixedComponentName(item.id);
          tableRows.push([
            fixedName,
            formatCurrency(item.value, 'BRL'),
            formatPercentage(item.percentage)
          ]);
        } else {
          console.warn('⚠️ [PDF Export] Invalid item data:', item);
        }
      });

      // Adicionar sub-componentes do CRS (apenas os que têm parent)
      const crsSubItems = validTableData.filter(sub => sub.isSub && sub.parent === 'crs_total');
      console.log('🔍 [PDF Export] CRS sub-items:', crsSubItems);
      
      crsSubItems.forEach(subItem => {
        // Validar dados antes de adicionar
        if (subItem.id && typeof subItem.value === 'number' && typeof subItem.percentage === 'number') {
          // Usar nome fixo do componente baseado no ID
          const fixedName = getFixedComponentName(subItem.id);
          tableRows.push([
            `└─ ${fixedName}`,
            formatCurrency(subItem.value, 'BRL'),
            formatPercentage(subItem.percentage)
          ]);
        } else {
          console.warn('⚠️ [PDF Export] Invalid sub-item data:', subItem);
        }
      });

      // Adicionar linha do total
      if (data?.valor && typeof data.valor === 'number') {
        tableRows.push([
          'Total',
          formatCurrency(data.valor, 'BRL'),
          '100.00%'
        ]);
      }

      console.log('🔍 [PDF Export] Final table rows:', tableRows);

      // Configurações da tabela
      const tableConfig = {
        head: [['Componente', 'Valor', '%']],
        body: tableRows,
        startY: 70 + (chartElement ? 120 : 0), // Posição após o gráfico
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
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
          0: { halign: 'left' },   // Componente
          1: { halign: 'right' },  // Valor
          2: { halign: 'right' }   // %
        },
        didDrawCell: (data: any) => {
          // Destacar linha do total
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fillColor = [200, 200, 200];
            data.cell.styles.fontStyle = 'bold';
          }
          
          // Destacar linha do CRS (componente principal)
          if (data.row.raw[0] && data.row.raw[0].includes('CRS') && !data.row.raw[0].includes('└─')) {
            data.cell.styles.fillColor = [255, 248, 220]; // Amarelo claro
          }
        }
      };

      // Gerar tabela
      (doc as any).autoTable(tableConfig);
      
                // Adicionar informações adicionais
                const finalY = (doc as any).lastAutoTable.finalY || 150;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text('* Grafico gerado automaticamente a partir dos dados da composicao', 20, finalY + 10);
                doc.text('* Valores em Reais (BRL) - Porcentagens com 2 casas decimais', 20, finalY + 18);
                doc.text(`* Exportado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, finalY + 26);
      
                // Adicionar aviso de confidencialidade
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(200, 0, 0); // Vermelho escuro
                doc.text('CONFIDENCIAL', 20, finalY + 40);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0); // Preto
                doc.text('Este documento contem informacoes confidenciais e proprietarias.', 20, finalY + 52);
                doc.text('E proibida a reproducao, distribuicao ou divulgacao sem autorizacao expressa.', 20, finalY + 60);
                doc.text('Destinatario: Uso exclusivo interno. Nao compartilhar com terceiros.', 20, finalY + 68);
      
      // Adicionar linha de separação
      doc.setDrawColor(200, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, finalY + 35, 190, finalY + 35);
      
      // Salvar PDF
      doc.save(`composicao_grafico_${format(targetDate, 'yyyy-MM-dd')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 [CompositionAnalysis] Fetching composition data for ${targetDate.toISOString().split('T')[0]}`);
      
      const result = await getCompositionDataWithComponents(targetDate);
      
      if (!result) {
        console.log(`❌ [CompositionAnalysis] No composition data found`);
        setError('Nenhum dado de composição encontrado');
      } else {
        console.log(`✅ [CompositionAnalysis] Found composition data:`, {
          data: result.data,
          hasValor: !!result.valor,
          hasComponentes: !!result.componentes,
          valor: result.valor,
          componentes: result.componentes
        });
      }
      
        setData(result);
      } catch (error) {
        console.error("❌ [CompositionAnalysis] Failed to fetch composition data:", error);
      setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [targetDate]);

  const { chartData, tableData, mainAssetData } = useMemo(() => {
    if (!data) {
      return { chartData: [], tableData: [], mainAssetData: null };
    }

    console.log(`🔄 [CompositionAnalysis] Processing data:`, {
      hasValoresOriginais: !!data.valores_originais,
      hasPorcentagens: !!data.porcentagens,
      hasValor: !!data.valor,
      valores_originais: data.valores_originais,
      porcentagens: data.porcentagens,
      valor: data.valor
    });

    // Verificar se temos a nova estrutura de dados
    if (!data.valores_originais || !data.porcentagens || !data.valor) {
      console.log(`⚠️ [CompositionAnalysis] Missing valores_originais, porcentagens or valor in data`);
      return { chartData: [], tableData: [], mainAssetData: null };
    }

    const valores = data.valores_originais;
    const porcentagens = data.porcentagens;
    const valorTotal = data.valor;

    // Extrair valores e porcentagens
    const vus = valores.vus || 0;
    const vmad = valores.vmad || 0;
    const carbono_crs = valores.carbono_crs || 0;
    const agua_crs = valores.agua_crs || 0;

    const vus_pct = parseFloat(porcentagens.vus_p?.replace('%', '') || '0');
    const vmad_pct = parseFloat(porcentagens.vmad_p?.replace('%', '') || '0');
    const carbono_crs_pct = parseFloat(porcentagens.carbono_crs_p?.replace('%', '') || '0');
    const agua_crs_pct = parseFloat(porcentagens.agua_crs_p?.replace('%', '') || '0');

    console.log(`📊 [CompositionAnalysis] Processed components:`, {
      vus: { value: vus, percentage: vus_pct },
      vmad: { value: vmad, percentage: vmad_pct },
      carbono_crs: { value: carbono_crs, percentage: carbono_crs_pct },
      agua_crs: { value: agua_crs, percentage: agua_crs_pct },
      total: vus + vmad + carbono_crs + agua_crs,
      expectedTotal: valorTotal
    });

    const crsTotalValue = carbono_crs + agua_crs;
    const crsTotalPct = carbono_crs_pct + agua_crs_pct;
    
    const chartItems = [
      { id: 'vus', name: FIXED_COMPONENT_NAMES.vus, value: vus },
      { id: 'vmad', name: FIXED_COMPONENT_NAMES.vmad, value: vmad },
      { id: 'crs_total', name: FIXED_COMPONENT_NAMES.crs_total, value: crsTotalValue }
    ].filter(item => item.value > 0);

    const tableItems = [
      { id: 'vus', name: FIXED_COMPONENT_NAMES.vus, value: vus, percentage: vus_pct, isSub: false },
      { id: 'vmad', name: FIXED_COMPONENT_NAMES.vmad, value: vmad, percentage: vmad_pct, isSub: false },
      { id: 'crs_total', name: FIXED_COMPONENT_NAMES.crs_total, value: crsTotalValue, percentage: crsTotalPct, isSub: false },
      { id: 'carbono_crs', name: FIXED_COMPONENT_NAMES.carbono_crs, value: carbono_crs, percentage: carbono_crs_pct, isSub: true, parent: 'crs_total' },
      { id: 'agua_crs', name: FIXED_COMPONENT_NAMES.agua_crs, value: agua_crs, percentage: agua_crs_pct, isSub: true, parent: 'crs_total' },
    ].filter(item => item.value > 0);
    
    const mainAsset = {
        id: 'valor_uso_solo',
        name: 'Valor de Uso do Solo',
        price: valorTotal,
        change: data.variacao_pct || 0,
        absoluteChange: data.variacao_abs || 0,
        currency: 'BRL',
        category: 'index',
        description: 'Índice de composição do uso do solo.',
        unit: 'Pontos',
        lastUpdated: data.data,
    };

    console.log(`✅ [CompositionAnalysis] Final result:`, {
      chartItems: chartItems.length,
      tableItems: tableItems.length,
      hasMainAsset: !!mainAsset,
      totalValue: valorTotal
    });

    return { chartData: chartItems, tableData: tableItems, mainAssetData: mainAsset };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
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

  if (error || !data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Dados Indisponíveis
          </CardTitle>
          <CardDescription>
            Não foi possível carregar os dados de composição para a data selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-72 text-muted-foreground">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
            <div className="space-y-2">
              <p>{error || `Nenhuma composição encontrada para ${format(targetDate, 'dd/MM/yyyy')}.`}</p>
              <p className="text-sm">
                Tente navegar para datas anteriores usando os controles acima.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => {
                  const yesterday = new Date(targetDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  window.location.href = `/analysis/composition?date=${yesterday.toISOString().split('T')[0]}`;
                }} 
                variant="default"
              >
                Data Anterior
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de tipos de gráfico */}
      <ChartTypeSelector 
        selectedType={chartType} 
        onTypeChange={setChartType} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <PieChartIcon className="h-6 w-6"/>
                  </div>
                       Composição do Índice "Valor de Uso do Solo"
                    </CardTitle>
                <CardDescription className="text-blue-100 mt-2 text-lg">
                  Distribuição dos componentes para <span className="font-bold text-white">{formatCurrency(data.valor, 'BRL')}</span> em <span className="font-semibold">{data.data}</span>
                    </CardDescription>
                </div>
              <div className="flex gap-2">
                <Button 
                  onClick={exportChartToPDF} 
                      variant="outline"
                      size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-96 p-6 bg-gradient-to-br from-white to-gray-50/50" id="composition-chart">
            <DynamicCompositionChart data={chartData} chartType={chartType} />
          </CardContent>
        </Card>

      <div className="lg:col-span-2">
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full" />
              Valores Detalhados
            </CardTitle>
            <CardDescription className="text-gray-600">
              Análise tabular de cada componente do índice
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg" id="detailed-values-table">
            <Table>
              <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-4">Componente</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4">Valor</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {tableData.filter(item => !item.isSub).map((item, index) => (
                  <React.Fragment key={item.id}>
                      <TableRow className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-green-50/30 transition-all duration-200 ${item.id === 'crs_total' ? 'font-bold bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-l-4 border-amber-400' : ''}`}>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-lg border-2 border-white" 
                              style={{ 
                                backgroundColor: getComponentColor(item.id)
                              }} 
                            />
                            <span className="font-medium text-gray-800">{getFixedComponentName(item.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-900 font-semibold py-4">
                          {formatCurrency(item.value, 'BRL')}
                      </TableCell>
                        <TableCell className="text-right font-mono text-gray-900 font-semibold py-4">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {formatPercentage(item.percentage)}
                          </span>
                        </TableCell>
                      </TableRow>
                      {item.id === 'crs_total' && tableData.filter(sub => 'parent' in sub && sub.parent === 'crs_total').map(subItem => (
                        <TableRow key={subItem.id} className="hover:bg-gradient-to-r hover:from-amber-50/20 hover:to-orange-50/20 transition-all duration-200">
                          <TableCell className="pl-12 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-600 font-bold">└─</span>
                              <span className="text-gray-700">{getFixedComponentName(subItem.id)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-700 py-3">
                            {formatCurrency(subItem.value, 'BRL')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-700 py-3">
                            <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                              {formatPercentage(subItem.percentage)}
                            </span>
                          </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                  <TableRow className="font-bold bg-gradient-to-r from-gray-100 to-gray-200 border-t-4 border-gray-300">
                    <TableCell className="py-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full" />
                        Total
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-900 font-bold py-4 text-lg">
                      {formatCurrency(data.valor, 'BRL')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-900 font-bold py-4 text-lg">
                      <span className="px-3 py-1 rounded-full bg-gray-800 text-white">
                        100.00%
                      </span>
                    </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      
      {/* Tabela Histórica */}
      <HistoricalCompositionTable className="mt-8" />
    </div>
  );
}