
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileSpreadsheet, Download, Eye, Loader2 } from 'lucide-react';
import { ExcelPreviewModal } from '@/components/excel-preview-modal';
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
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
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
          <DropdownMenuItem onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            <span>{t.excelExport.buttons.previewExcel}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Baixar como .xlsx</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Baixar como .csv</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
