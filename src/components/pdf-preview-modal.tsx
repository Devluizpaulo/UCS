

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
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, AlertCircle, RotateCcw, ExternalLink, Eye, Maximize2, Minimize2, RotateCw, FileText, Settings } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);

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
  // AVISO: A remoção de generateAndSetPdf da lista de dependências é intencional
  // para quebrar um loop de renderização infinito causado pela sua recriação
  // a cada mudança de estado (pdfUrl). O comportamento desejado é que a função
  // seja chamada apenas quando o modal abre ou o template muda.
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
      
      // Fechar o modal após um pequeno delay para garantir que o download foi iniciado
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no Download', description: 'Não foi possível baixar o arquivo.' });
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-[98vw] max-h-[98vh]' : 'max-w-[95vw] max-h-[95vh]'} w-full h-full flex flex-col`}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Pré-visualização do Relatório</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Visualize, configure e baixe seu relatório em formato PDF
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleFullscreen}
              className="shrink-0"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>
        
        <DialogBody className="flex-grow flex flex-col gap-6 min-h-0">
          {/* Barra de Ferramentas Superior */}
          <div className="flex-shrink-0 bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Seleção de Template */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="template-select" className="text-sm font-medium text-foreground">
                    Modelo de Relatório:
                  </label>
                </div>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template-select" className="w-[280px] h-9">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Controles de Visualização */}
              <div className="flex items-center gap-2">
                {/* Controles de Zoom */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    className="h-8 w-8"
                    title="Diminuir zoom"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setZoom(1)} 
                    className="h-8 px-3 text-sm font-medium min-w-[60px]"
                    title="Zoom padrão"
                  >
                    {Math.round(zoom * 100)}%
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                    className="h-8 w-8"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Controles de Rotação */}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRotate}
                  className="h-9 w-9"
                  title="Rotacionar documento"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

                {/* Ações do PDF */}
                {pdfUrl && (
                  <div className="flex items-center gap-2 pl-2 border-l border-border">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleDownload}
                      className="h-9 text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área de Visualização do PDF */}
          <div className="flex-grow bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden relative">
            {generationState.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">Gerando Relatório</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {TEMPLATE_OPTIONS[selectedTemplate as keyof typeof TEMPLATE_OPTIONS]}
                    </p>
                  </div>
                </div>
              </div>
            ) : generationState.error ? (
              <div className="absolute inset-0 flex items-center justify-center p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 text-center max-w-md">
                  <div className="p-4 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div>
                    <p className="text-destructive font-semibold text-xl mb-2">Erro na Geração</p>
                    <p className="text-sm text-muted-foreground mb-6">{generationState.error}</p>
                    {generationState.retryCount < maxRetries && (
                      <Button variant="outline" onClick={handleRetry} className="mt-2">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Tentar Novamente ({generationState.retryCount}/{maxRetries})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="w-full h-full flex items-center justify-center relative">
                {/* Indicador de carregamento do iframe */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10" id="iframe-loading">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Carregando PDF...</p>
                  </div>
                </div>
                
                <div 
                  className="w-full h-full bg-white dark:bg-gray-900 overflow-hidden relative z-20"
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=${Math.round(zoom * 100)}&view=FitH`}
                    className="w-full h-full border-0"
                    title={`Pré-visualização do PDF - ${TEMPLATE_OPTIONS[selectedTemplate as keyof typeof TEMPLATE_OPTIONS]}`}
                    style={{ 
                      minHeight: '100%',
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
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 text-center max-w-lg">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Eye className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xl mb-2 text-foreground">Nenhuma Pré-visualização</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Gere um relatório para visualizar o PDF ou baixe diretamente o arquivo.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={generateAndSetPdf}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Gerar PDF
                      </Button>
                      <Button variant="default" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>
        
        {/* Rodapé Simplificado */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {pdfUrl ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  PDF pronto para visualização
                </span>
              ) : (
                <span>Pré-visualização não disponível</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button 
                onClick={handleDownload} 
                disabled={!pdfUrl || generationState.isLoading}
                className="min-w-[120px]"
              >
                <Download className="mr-2 h-4 w-4" />
                {generationState.isLoading ? 'Gerando...' : 'Baixar'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
