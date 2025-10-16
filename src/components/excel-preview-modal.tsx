'use client';

import { useState } from 'react';
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
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { CommodityPriceData } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useLanguage } from '@/lib/language-context';

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

const getStatusIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-600" />;
};

const categoryColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500'
];

const getDateLocale = (language: string) => {
  switch (language) {
    case 'en': return enUS;
    case 'es': return es;
    default: return ptBR;
  }
};

export function ExcelPreviewModal({ 
  isOpen, 
  onClose, 
  onExport, 
  data, 
  isExporting 
}: ExcelPreviewModalProps) {
  const { language, t } = useLanguage();

  if (!data) return null;

  const { allData, categoryData, variationsData, targetDate, totalAssets, positiveChanges, negativeChanges, stableChanges } = data;
  
  const pieChartComponents = Object.entries(categoryData).reduce(
    (acc: { components: JSX.Element[]; rotation: number }, [_, count], index) => {
      const percentage = (count / totalAssets) * 100;
      const rotation = acc.rotation;
      const newRotation = rotation + percentage * 3.6;
      const color = categoryColors[index % categoryColors.length];

      const newComponents = [...acc.components];

      newComponents.push(
        <div
          key={index}
          className={`absolute inset-0 rounded-full ${color}`}
          style={{
            clipPath: `inset(0 ${percentage > 50 ? '0' : '50%'} 0 0)`,
            transform: `rotate(${rotation}deg)`,
          }}
        />
      );

      if (percentage > 50) {
        newComponents.push(
          <div
            key={`${index}-over50`}
            className={`absolute inset-0 rounded-full ${color}`}
            style={{
              clipPath: 'inset(0 0 0 50%)',
              transform: `rotate(${newRotation}deg)`,
            }}
          />
        );
      }

      return {
        components: newComponents,
        rotation: newRotation,
      };
    },
    { components: [], rotation: 0 }
  ).components;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
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
                 {t.excelPreview.title}
               </DialogTitle>
             </div>
             <p className="text-sm text-gray-600">
               {t.excelPreview.subtitle} {format(targetDate, 'dd/MM/yyyy', { locale: getDateLocale(language) })}
             </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-muted/30">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.excelPreview.totalAssets}</p>
                      <p className="text-2xl font-bold text-blue-600">{totalAssets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.excelPreview.rising}</p>
                      <p className="text-2xl font-bold text-green-600">{positiveChanges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.excelPreview.falling}</p>
                      <p className="text-2xl font-bold text-red-600">{negativeChanges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Minus className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t.excelPreview.stable}</p>
                      <p className="text-2xl font-bold text-gray-600">{stableChanges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">{t.excelPreview.tabs.mainData}</TabsTrigger>
              <TabsTrigger value="distribuicao">{t.excelPreview.tabs.distribution}</TabsTrigger>
              <TabsTrigger value="variacoes">{t.excelPreview.tabs.topVariations}</TabsTrigger>
            </TabsList>

            {/* Aba 1: Dados Principais */}
            <TabsContent value="dados" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.excelPreview.tabs.mainData}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-600 text-white sticky top-0">
                          <th className="border p-2 text-left text-sm">{t.excelPreview.table.asset}</th>
                          <th className="border p-2 text-right text-sm">{t.excelPreview.table.price}</th>
                          <th className="border p-2 text-right text-sm">{t.excelPreview.table.variation}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allData.map((asset, index) => (
                          <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="border p-2 font-medium">{asset.name}</td>
                            <td className="border p-2 text-right font-mono">
                              {formatCurrency(asset.price, asset.currency, asset.id)}
                            </td>
                            <td className={`border p-2 text-right font-mono font-medium ${
                              asset.change > 0 ? 'text-green-600' : asset.change < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {formatPercentage(asset.change)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba 2: Distribuição por Categoria */}
            <TabsContent value="distribuicao" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.excelPreview.distribution.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="relative w-64 h-64 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gray-200" />
                    {pieChartComponents}
                    <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
                      <PieChart className="h-16 w-16 text-blue-600" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(categoryData).map(([category, count], index) => (
                      <div key={category} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${categoryColors[index % categoryColors.length]}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{category}</span>
                            <span className="text-sm text-muted-foreground">{count} {t.excelPreview.distribution.assets}</span>
                          </div>
                          <Progress value={(count / totalAssets) * 100} className="h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba 3: Top Variações */}
            <TabsContent value="variacoes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.excelPreview.topVariations.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variationsData.map((asset, index) => {
                      const percentage = Math.abs(asset.change);
                      const maxChange = Math.max(...variationsData.map(v => Math.abs(v.change)));
                      const barWidth = maxChange > 0 ? (percentage / maxChange) * 100 : 0;

                      return (
                        <div key={asset.id} className="flex items-center gap-4 text-sm">
                          <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>
                          <span className="flex-1 font-medium truncate">{asset.name}</span>
                          <div className="w-1/3">
                            <div className="w-full bg-muted rounded-full h-4">
                              <div
                                className={`h-4 rounded-full ${asset.change > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          <span className={`w-20 text-right font-mono font-bold ${
                            asset.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(asset.change)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

           <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">{t.excelPreview.features.title}</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    {t.excelPreview.features.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {t.excelPreview.buttons.cancel}
          </Button>
          <Button onClick={onExport} disabled={isExporting} className="min-w-[150px]">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.excelPreview.buttons.generating}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {t.excelPreview.buttons.exportToExcel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
