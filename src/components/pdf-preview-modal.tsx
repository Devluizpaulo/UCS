
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { generatePdf } from '@/lib/pdf-generator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from './ui/label';

type PdfTemplate = 'simple' | 'complete' | 'executive';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reportType: string;
  data: any;
}

export function PdfPreviewModal({ isOpen, onOpenChange, reportType, data }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<PdfTemplate>('complete');
  const [zoom, setZoom] = useState(1);

  const generateAndSetPdf = useCallback(async (currentTemplate: PdfTemplate) => {
    setIsLoading(true);
    // Revoke previous URL to free memory
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    try {
      const url = await generatePdf(reportType, data, currentTemplate);
      setPdfUrl(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setPdfUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [pdfUrl, reportType, data]);


  useEffect(() => {
    if (isOpen) {
      generateAndSetPdf(template);
    } else {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    }
  // The linter wants generateAndSetPdf and template in the dependency array.
  // Adding them would cause an infinite loop because generateAndSetPdf creates a new object URL,
  // which changes pdfUrl, which is a dependency of generateAndSetPdf.
  // We explicitly want this to run only when `isOpen` changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, template]);

  const handleTemplateChange = (newTemplate: PdfTemplate) => {
    setTemplate(newTemplate);
    // The useEffect will catch this change and regenerate the PDF.
  }

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${reportType}_${template}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização do Relatório em PDF</DialogTitle>
          <DialogDescription>
            Escolha um modelo e visualize o relatório antes de baixar.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex-grow flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
                 <div className="grid gap-1.5">
                    <Label htmlFor="template">Modelo do Relatório</Label>
                     <Select value={template} onValueChange={(value: PdfTemplate) => handleTemplateChange(value)}>
                      <SelectTrigger id="template" className="w-[180px]">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simples</SelectItem>
                        <SelectItem value="complete">Completo</SelectItem>
                        <SelectItem value="executive">Executivo</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Diminuir zoom">
                        <ZoomOut />
                    </Button>
                     <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Aumentar zoom">
                        <ZoomIn />
                    </Button>
                    <Button variant="outline" onClick={() => generateAndSetPdf(template)} disabled={isLoading} title="Atualizar pré-visualização">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>
            <div className="flex-grow bg-secondary rounded-md flex items-center justify-center relative overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Gerando PDF...</span>
                    </div>
                ) : pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="Pré-visualização do PDF"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    />
                ) : (
                    <p className="text-destructive">Falha ao carregar o PDF.</p>
                )}
            </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleDownload} disabled={!pdfUrl || isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
