'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { PdfPreviewModal } from '@/components/pdf-preview-modal';
import { generatePdf, type DashboardPdfData } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';

interface PdfExportButtonProps {
  data: DashboardPdfData;
  reportType: string;
  fileName?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function PdfExportButton({
  data,
  reportType,
  fileName,
  variant = 'outline',
  size = 'sm',
  className,
  disabled = false,
  children
}: PdfExportButtonProps) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handlePdfExport = async () => {
    setIsGenerating(true);
    
    try {
      // Validar dados antes de abrir o modal
      if (!data || !data.targetDate) {
        throw new Error('Dados inválidos para geração do PDF');
      }

      setIsPdfPreviewOpen(true);
    } catch (error) {
      console.error('Erro ao preparar dados para PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Gerar PDF',
        description: error instanceof Error ? error.message : 'Não foi possível preparar os dados para o PDF.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handlePdfExport}
        disabled={disabled || isGenerating}
        aria-label={`Exportar ${reportType} em PDF`}
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        {children || 'PDF'}
      </Button>

      {/* Modal de Preview do PDF */}
      <PdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        reportType={reportType}
        data={data}
      />
    </>
  );
}
