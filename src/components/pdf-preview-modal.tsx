

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, AlertCircle, RotateCcw } from 'lucide-react';
import { generatePdf, type DashboardPdfData } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

const TEMPLATE_OPTIONS: Record<string, string> = {
  executive: 'Relatório Executivo',
  composition: 'Relatório de Composição',
  report: 'Relatório de Análise IA',
};


export function PdfPreviewModal({ isOpen, onOpenChange, reportType, data }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(reportType);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const pdfCacheRef = useRef<Map<string, string>>(new Map());
  const maxRetries = 2;

  const generateAndSetPdf = useCallback(() => {
    const cacheKey = `${selectedTemplate}-${data.targetDate.toISOString()}`;
    if (pdfCacheRef.current.has(cacheKey)) {
      setPdfUrl(pdfCacheRef.current.get(cacheKey)!);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
      return;
    }

    setGenerationState({ isLoading: true, error: null, retryCount: generationState.retryCount });
    
    setTimeout(() => {
        try {
            const url = generatePdf(selectedTemplate, data);
            
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
    }, 50);

  }, [selectedTemplate, data, pdfUrl, toast, generationState.retryCount]);

  useEffect(() => {
    if (isOpen) {
      generateAndSetPdf();
    } else {
      // Limpa todas as URLs em cache ao fechar
      pdfCacheRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch(e) {
          // Silencia erros
        }
      });
      pdfCacheRef.current.clear();
      setPdfUrl(null);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
    }
  // AVISO: A remoção de generateAndSetPdf da lista de dependências é intencional
  // para quebrar um loop de renderização infinito causado pela sua recriação
  // a cada mudança de estado (pdfUrl). O comportamento desejado é que a função
  // seja chamada apenas quando o modal abre ou o template muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTemplate]);


  const handleRetry = () => {
    if (generationState.retryCount < maxRetries) {
      generateAndSetPdf();
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
      link.download = `${selectedTemplate}_${format(data.targetDate, 'yyyy-MM-dd')}.pdf`;
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
            Selecione um modelo, visualize e baixe o seu relatório em formato PDF.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex-grow flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <label htmlFor="template-select" className="text-sm font-medium">Modelo:</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template-select" className="w-[220px]">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_OPTIONS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="text-muted-foreground w-12">{Math.round(zoom * 100)}%</Button>
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex-grow bg-secondary rounded-md flex items-center justify-center relative overflow-auto">
            {generationState.isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Gerando {TEMPLATE_OPTIONS[selectedTemplate as keyof typeof TEMPLATE_OPTIONS]}...</p>
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
