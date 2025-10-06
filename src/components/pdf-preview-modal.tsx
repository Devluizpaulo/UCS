

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
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, AlertCircle, RotateCcw, ExternalLink, Eye } from 'lucide-react';
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
  const [iframeLoaded, setIframeLoaded] = useState(false);

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
    
    // Usar setTimeout para garantir que a UI seja atualizada
    setTimeout(() => {
        try {
            console.log('Gerando PDF para template:', selectedTemplate);
            console.log('Dados para PDF:', data);
            
            const url = generatePdf(selectedTemplate, data);
            
            if (!url) {
                throw new Error('Falha ao gerar documento PDF - URL vazia');
            }
            
            // Limpar URL anterior (apenas blob URLs precisam ser revogadas)
            if (pdfUrl && pdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(pdfUrl);
            }

            // Validar se a URL é válida (aceita blob: ou data: URIs)
            if (typeof url !== 'string' || (!url.startsWith('blob:') && !url.startsWith('data:application/pdf'))) {
                console.error('URL inválida recebida:', url);
                throw new Error('URL do PDF inválida - formato não suportado');
            }

            pdfCacheRef.current.set(cacheKey, url);
            setPdfUrl(url);
            setIframeLoaded(false); // Reset iframe loading state
            setGenerationState({ isLoading: false, error: null, retryCount: 0 });
            
            console.log('PDF gerado com sucesso:', url);
            console.log('Tamanho da URL:', url.length);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na geração do PDF';
            console.error("Falha ao gerar PDF:", error);
            console.error("Stack trace:", error instanceof Error ? error.stack : 'N/A');
            
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
    }, 100);

  }, [selectedTemplate, data, pdfUrl, toast, generationState.retryCount]);

  useEffect(() => {
    if (isOpen) {
      generateAndSetPdf();
    } else {
      // Limpa todas as URLs em cache ao fechar (apenas blob URLs)
      pdfCacheRef.current.forEach(url => {
        try {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        } catch(e) {
          // Silencia erros
        }
      });
      pdfCacheRef.current.clear();
      setPdfUrl(null);
      setIframeLoaded(false);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTemplate]);

  // Timeout para detectar se o iframe não carregou
  useEffect(() => {
    if (pdfUrl && !iframeLoaded) {
      const timeout = setTimeout(() => {
        console.warn('PDF iframe não carregou em tempo hábil');
        // Não definir erro automaticamente, apenas log
      }, 10000); // 10 segundos

      return () => clearTimeout(timeout);
    }
  }, [pdfUrl, iframeLoaded]);


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
              
              {pdfUrl && (
                <div className="ml-2 pl-2 border-l border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              )}
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
              <div className="w-full h-full flex items-center justify-center relative">
                {/* Indicador de carregamento do iframe */}
                <div className="absolute inset-0 flex items-center justify-center bg-secondary rounded-md z-10" id="iframe-loading">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Carregando PDF...</p>
                  </div>
                </div>
                
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(zoom * 100)}`}
                  className="w-full h-full border-0 rounded-md shadow-lg relative z-20"
                  title={`Pré-visualização do PDF - ${TEMPLATE_OPTIONS[selectedTemplate as keyof typeof TEMPLATE_OPTIONS]}`}
                  style={{ 
                    minHeight: '600px',
                    backgroundColor: 'white'
                  }}
                  onLoad={(e) => {
                    console.log('PDF carregado com sucesso');
                    setIframeLoaded(true);
                    // Remover indicador de carregamento
                    const loadingElement = document.getElementById('iframe-loading');
                    if (loadingElement) {
                      loadingElement.style.display = 'none';
                    }
                  }}
                  onError={(e) => {
                    console.error('Erro ao carregar PDF:', e);
                    setGenerationState(prev => ({
                      ...prev,
                      error: 'Erro ao carregar a pré-visualização do PDF'
                    }));
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
                <Eye className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium mb-2">Nenhuma pré-visualização disponível</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique em "Baixar PDF" para visualizar o relatório ou tente gerar novamente.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={generateAndSetPdf}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </Button>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar PDF
                    </Button>
                  </div>
                </div>
              </div>
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
