
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, AlertCircle, RotateCcw } from 'lucide-react';
import { generatePdf, type DashboardPdfData } from '@/lib/pdf-generator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type PdfTemplate = 'simple' | 'commercial' | 'executive';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reportType: string;
  data: DashboardPdfData;
}

interface GenerationState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export function PdfPreviewModal({ isOpen, onOpenChange, reportType, data }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<PdfTemplate>('executive');
  const [zoom, setZoom] = useState(1);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const pdfCacheRef = useRef<Map<string, string>>(new Map());
  const maxRetries = 2;

  const generateAndSetPdf = useCallback(async (currentTemplate: PdfTemplate) => {
    const cacheKey = `${reportType}_${currentTemplate}_${data.targetDate.toISOString()}`;
    
    if (pdfCacheRef.current.has(cacheKey)) {
      setPdfUrl(pdfCacheRef.current.get(cacheKey)!);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
      return;
    }

    setGenerationState({ isLoading: true, error: null, retryCount: 0 });
    
    // Libera a UI para renderizar o loader antes de iniciar a tarefa pesada
    setTimeout(() => {
        try {
            const url = generatePdf(reportType, data, currentTemplate);
            
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);

            pdfCacheRef.current.set(cacheKey, url);
            setPdfUrl(url);
            setGenerationState({ isLoading: false, error: null, retryCount: 0 });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na geração do PDF';
            console.error("Falha ao gerar PDF:", error);
            
            setGenerationState(prev => ({
                isLoading: false,
                error: errorMessage,
                retryCount: prev.retryCount + 1
            }));

            toast({
                variant: 'destructive',
                title: 'Erro na Geração do PDF',
                description: errorMessage,
            });
        }
    }, 50); // Pequeno delay para garantir que o estado de loading seja renderizado

  }, [reportType, data, pdfUrl, toast]);

  useEffect(() => {
    if (isOpen) {
      generateAndSetPdf(template);
    } else {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
    }
  // A dependência `generateAndSetPdf` garante que o efeito seja re-executado se a função mudar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, template]);


  const handleTemplateChange = (newTemplate: PdfTemplate) => {
    setTemplate(newTemplate);
    // Dispara a regeneração via useEffect
    generateAndSetPdf(newTemplate);
  };

  const handleRetry = () => {
    if (generationState.retryCount < maxRetries) {
      generateAndSetPdf(template);
    } else {
        toast({
            variant: 'destructive',
            title: 'Falha Persistente',
            description: 'Não foi possível gerar o PDF após várias tentativas.',
        });
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) {
      toast({ variant: 'destructive', title: 'Erro no Download', description: 'PDF não está disponível.' });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${reportType}_${template}_${format(data.targetDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Download Iniciado', description: 'Seu relatório está sendo baixado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no Download', description: 'Não foi possível baixar o arquivo.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          <DialogDescription>
            Escolha um modelo, visualize e baixe o seu relatório.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex-grow flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid gap-1.5">
              <Label htmlFor="template">Modelo do Relatório</Label>
              <Select value={template} onValueChange={(value: PdfTemplate) => handleTemplateChange(value)}>
                <SelectTrigger id="template" className="w-[180px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">📊 Simples</SelectItem>
                  <SelectItem value="commercial">💼 Comercial</SelectItem>
                  <SelectItem value="executive">👔 Executivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="text-muted-foreground w-12">{Math.round(zoom * 100)}%</Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
              </div>
              <Button variant="outline" onClick={() => generateAndSetPdf(template)} disabled={generationState.isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${generationState.isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="flex-grow bg-secondary rounded-md flex items-center justify-center relative overflow-auto">
            {generationState.isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Gerando relatório...</p>
              </div>
            ) : generationState.error ? (
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium">Erro na Geração do PDF</p>
                <p className="text-sm text-muted-foreground">{generationState.error}</p>
                {generationState.retryCount < maxRetries && (
                  <Button variant="outline" onClick={handleRetry} className="mt-2">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente ({generationState.retryCount}/{maxRetries})
                  </Button>
                )}
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`Pré-visualização do PDF`}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              />
            ) : (
              <p className="text-muted-foreground">Nenhuma pré-visualização disponível.</p>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button onClick={handleDownload} disabled={!pdfUrl || generationState.isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

