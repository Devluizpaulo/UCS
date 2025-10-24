'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileSpreadsheet, Download, Eye, Loader2 } from 'lucide-react';
import { ExcelPreviewModal } from '@/components/excel-preview-modal';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { CommodityPriceData } from '@/lib/types';
import { useLanguage } from '@/lib/language-context';

interface ExcelExportButtonProps {
  data: {
    mainIndex?: CommodityPriceData;
    secondaryIndices: CommodityPriceData[];
    currencies: CommodityPriceData[];
    otherAssets: CommodityPriceData[];
    targetDate: Date;
  };
  onExport: (format: 'xlsx' | 'csv') => Promise<void>;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExcelExportButton({ 
  data, 
  onExport, 
  className,
  variant = 'outline',
  size = 'default'
}: ExcelExportButtonProps) {
  const { language, t } = useLanguage();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const allData = [data.mainIndex, ...data.secondaryIndices, ...data.currencies, ...data.otherAssets].filter(Boolean) as CommodityPriceData[];
  
  const categoryData = allData.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const variationsData = allData
    .filter(asset => Math.abs(asset.change) > 0.01)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 10);

  const totalAssets = allData.length;
  const positiveChanges = allData.filter(asset => asset.change > 0).length;
  const negativeChanges = allData.filter(asset => asset.change < 0).length;
  const stableChanges = allData.filter(asset => asset.change === 0).length;

  const previewData = {
    allData,
    categoryData,
    variationsData,
    targetDate: data.targetDate,
    totalAssets,
    positiveChanges,
    negativeChanges,
    stableChanges,
  };

  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    setIsExporting(true);
    try {
      await onExport(format);
      setIsPreviewOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsPreviewOpen(true)}
          className={className}
          disabled={allData.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t.excelExport.buttons.previewExcel}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size={size}
              disabled={allData.length === 0 || isExporting}
              className={className}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.excelExport.buttons.exporting}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t.excelExport.buttons.exportExcel}
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              CSV (Google Sheets)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExcelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onExport={() => handleExport('xlsx')}
        data={previewData}
        isExporting={isExporting}
      />
    </>
  );
}
