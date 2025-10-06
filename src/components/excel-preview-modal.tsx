'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  FileSpreadsheet, 
  Download, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommodityPriceData } from '@/lib/types';

interface ExcelPreviewData {
  allData: CommodityPriceData[];
  categoryData: Record<string, number>;
  variationsData: CommodityPriceData[];
  targetDate: Date;
  totalAssets: number;
  positiveChanges: number;
  negativeChanges: number;
  stableChanges: number;
}

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  data: ExcelPreviewData | null;
  isExporting: boolean;
}

export function ExcelPreviewModal({ 
  isOpen, 
  onClose, 
  onExport, 
  data, 
  isExporting 
}: ExcelPreviewModalProps) {
  const [previewStep, setPreviewStep] = useState(1);

  if (!data) return null;

  const { allData, categoryData, variationsData, targetDate, totalAssets, positiveChanges, negativeChanges, stableChanges } = data;

  const getStatusIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (change: number) => {
    if (change > 0) return <Badge className="bg-green-100 text-green-800 border-green-200">📈 Alta</Badge>;
    if (change < 0) return <Badge className="bg-red-100 text-red-800 border-red-200">📉 Baixa</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">➡️ Estável</Badge>;
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const categoryColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white px-3 py-1 rounded-md font-bold text-sm">
                UCS INDEX
              </div>
              <div className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                BMV
              </div>
            </div>
            <DialogTitle className="text-xl font-bold">
              Preview do Excel - Painel de Cotações
            </DialogTitle>
          </div>
          <p className="text-sm text-gray-600">
            Dados para {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total de Ativos</p>
                    <p className="text-2xl font-bold text-blue-600">{totalAssets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Alta</p>
                    <p className="text-2xl font-bold text-green-600">{positiveChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Baixa</p>
                    <p className="text-2xl font-bold text-red-600">{negativeChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Minus className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Estável</p>
                    <p className="text-2xl font-bold text-gray-600">{stableChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navegação por Steps */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={previewStep === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewStep(1)}
            >
              📊 Dados Principais
            </Button>
            <Button
              variant={previewStep === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewStep(2)}
            >
              🍕 Gráfico Pizza
            </Button>
            <Button
              variant={previewStep === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewStep(3)}
            >
              📊 Top Variações
            </Button>
          </div>

          {/* Step 1: Dados Principais */}
          {previewStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Tabela Principal de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="border p-2 text-left">Categoria</th>
                        <th className="border p-2 text-left">Ativo</th>
                        <th className="border p-2 text-right">Preço</th>
                        <th className="border p-2 text-right">Variação</th>
                        <th className="border p-2 text-right">Variação Abs.</th>
                        <th className="border p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allData.slice(0, 10).map((asset, index) => (
                        <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border p-2">
                            <Badge variant="outline">{asset.category}</Badge>
                          </td>
                          <td className="border p-2 font-medium">{asset.name}</td>
                          <td className="border p-2 text-right">
                            {formatCurrency(asset.price, asset.currency)}
                          </td>
                          <td className={`border p-2 text-right font-medium ${
                            asset.change > 0 ? 'text-green-600' : 
                            asset.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {formatPercentage(asset.change)}
                          </td>
                          <td className="border p-2 text-right">
                            {formatCurrency(asset.absoluteChange, asset.currency)}
                          </td>
                          <td className="border p-2 text-center">
                            {getStatusBadge(asset.change)}
                          </td>
                        </tr>
                      ))}
                      {allData.length > 10 && (
                        <tr>
                          <td colSpan={6} className="border p-2 text-center text-gray-500 italic">
                            ... e mais {allData.length - 10} ativos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Gráfico de Pizza */}
          {previewStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preview do Gráfico */}
                  <div className="flex flex-col items-center">
                    <div className="w-64 h-64 relative">
                      <div className="w-full h-full rounded-full border-4 border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-16 w-16 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Gráfico de Pizza</p>
                          <p className="text-xs text-gray-500">Será gerado no Excel</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dados das Categorias */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Dados por Categoria:</h4>
                    {Object.entries(categoryData).map(([category, count], index) => {
                      const percentage = (count / totalAssets) * 100;
                      return (
                        <div key={category} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${categoryColors[index % categoryColors.length]}`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-gray-600">{count} ativos</span>
                            </div>
                            <Progress value={percentage} className="h-2 mt-1" />
                            <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Top Variações */}
          {previewStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 10 Maiores Variações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preview do Gráfico de Barras */}
                  <div className="flex flex-col items-center">
                    <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Gráfico de Barras</p>
                        <p className="text-xs text-gray-500">Será gerado no Excel</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista das Variações */}
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-3">Ranking de Variações:</h4>
                    {variationsData.slice(0, 10).map((asset, index) => (
                      <div key={asset.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{asset.name}</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(asset.change)}
                            <span className={`text-sm font-medium ${
                              asset.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(asset.change)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Recursos do Excel Exportado:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Logo BMV integrado no cabeçalho
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Formatação condicional com cores
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Gráfico de pizza interativo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Gráfico de barras das top variações
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Auto-ajuste de colunas e formatação profissional
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={onExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando Excel...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
