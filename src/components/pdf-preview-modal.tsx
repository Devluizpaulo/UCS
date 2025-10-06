
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
import { Alert, AlertDescription } from './ui/alert';

type PdfTemplate = 'simple' | 'complete' | 'executive';

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
  const [template, setTemplate] = useState<PdfTemplate>('complete');
  const [zoom, setZoom] = useState(1);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const pdfCacheRef = useRef<Map<string, string>>(new Map());
  const maxRetries = 3;

  const generateAndSetPdf = useCallback(async (currentTemplate: PdfTemplate, isRetry = false) => {
    const cacheKey = `${reportType}_${currentTemplate}_${JSON.stringify(data)}`;
    
    // Verifica cache primeiro
    if (!isRetry && pdfCacheRef.current.has(cacheKey)) {
      const cachedUrl = pdfCacheRef.current.get(cacheKey)!;
      setPdfUrl(cachedUrl);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
      return;
    }

    setGenerationState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      // Validação dos dados antes da geração
      if (!data || !data.targetDate) {
        throw new Error('Dados inválidos para geração do PDF');
      }

      const url = generatePdf(reportType, data, currentTemplate);
      
      // Revoke the old object URL if it exists, to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      // Cache do PDF gerado
      pdfCacheRef.current.set(cacheKey, url);
      setPdfUrl(url);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na geração do PDF';
      console.error("Failed to generate PDF:", error);
      
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
  }, [reportType, data, pdfUrl, toast]);

  useEffect(() => {
    if (isOpen) {
      generateAndSetPdf(template);
    } else {
      // Cleanup when modal closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      // Reset generation state when modal closes
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
    }
  }, [isOpen, template, generateAndSetPdf]);

  const handleTemplateChange = (newTemplate: PdfTemplate) => {
    setTemplate(newTemplate);
    // The useEffect will catch this change and regenerate the PDF.
  };

  const handleRetry = () => {
    if (generationState.retryCount < maxRetries) {
      generateAndSetPdf(template, true);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'Erro no Download',
        description: 'PDF não está disponível para download.',
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${reportType}_${template}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download Iniciado',
        description: 'O arquivo PDF está sendo baixado.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Download',
        description: 'Não foi possível iniciar o download do arquivo.',
      });
    }
  };

  const resetZoom = () => setZoom(1);
  
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
          {/* Controles do Relatório */}
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid gap-1.5">
              <Label htmlFor="template">Modelo do Relatório</Label>
              <Select value={template} onValueChange={(value: PdfTemplate) => handleTemplateChange(value)}>
                <SelectTrigger id="template" className="w-[180px]">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">
                    <div className="flex flex-col">
                      <span>Simples</span>
                      <span className="text-xs text-muted-foreground">Resumo básico</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="complete">
                    <div className="flex flex-col">
                      <span>Completo</span>
                      <span className="text-xs text-muted-foreground">Detalhado com todas as seções</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="executive">
                    <div className="flex flex-col">
                      <span>Executivo</span>
                      <span className="text-xs text-muted-foreground">Formato profissional</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Controles de Zoom */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))} 
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetZoom} 
                  title="Resetar zoom"
                  aria-label="Resetar zoom para 100%"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Botão de Atualizar */}
              <Button 
                variant="outline" 
                onClick={() => generateAndSetPdf(template)} 
                disabled={generationState.isLoading} 
                title="Atualizar pré-visualização"
                aria-label="Atualizar pré-visualização do PDF"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${generationState.isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          {/* Área de Visualização do PDF */}
          <div className="flex-grow bg-secondary rounded-md flex items-center justify-center relative overflow-hidden">
            {generationState.isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="text-center">
                  <p className="font-medium">Gerando PDF...</p>
                  <p className="text-sm">Modelo: {template === 'simple' ? 'Simples' : template === 'complete' ? 'Completo' : 'Executivo'}</p>
                </div>
              </div>
            ) : generationState.error ? (
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="space-y-2">
                  <p className="text-destructive font-medium">Erro na Geração do PDF</p>
                  <p className="text-sm text-muted-foreground">{generationState.error}</p>
                  {generationState.retryCount < maxRetries && (
                    <Button 
                      variant="outline" 
                      onClick={handleRetry}
                      className="mt-2"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Tentar Novamente ({generationState.retryCount}/{maxRetries})
                    </Button>
                  )}
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`Pré-visualização do PDF - Modelo ${template}`}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                aria-label={`Visualização do relatório PDF no modelo ${template}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8" />
                <p>Nenhum PDF disponível para visualização.</p>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {pdfUrl && (
              <span>PDF gerado com sucesso</span>
            )}
            {generationState.retryCount > 0 && (
              <span>• Tentativas: {generationState.retryCount}/{maxRetries}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleDownload} 
              disabled={!pdfUrl || generationState.isLoading}
              aria-label={`Baixar PDF do modelo ${template}`}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
