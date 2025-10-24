

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, AlertCircle, RotateCcw, ExternalLink, Eye, Maximize2, Minimize2, RotateCw, FileText, Settings } from 'lucide-react';
import { generatePdf } from '@/lib/pdf-generator';
import type { DashboardPdfData } from '@/lib/types';
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
  const [includeChart, setIncludeChart] = useState(true);
  const [includeContext, setIncludeContext] = useState(true);
  const [includeTable, setIncludeTable] = useState(true);
  const [chartOnSeparatePage, setChartOnSeparatePage] = useState(false);
  const [chartScale, setChartScale] = useState<number>(2);
  const [kpiOrderBy, setKpiOrderBy] = useState<'price_desc' | 'change_desc' | 'change_asc'>('price_desc');
  const [reportTitle, setReportTitle] = useState<string>('Relatório Executivo');
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });
  
  const { toast } = useToast();
  const pdfCacheRef = useRef<Map<string, string>>(new Map());
  const maxRetries = 2;

  // --- Persistência de preferências (zoom, fullscreen e opções de relatório) ---
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('pdfPreviewPrefs');
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.zoom === 'number') setZoom(Math.min(2, Math.max(0.5, prefs.zoom)));
        if (typeof prefs.isFullscreen === 'boolean') setIsFullscreen(prefs.isFullscreen);
        if (typeof prefs.includeChart === 'boolean') setIncludeChart(prefs.includeChart);
        if (typeof prefs.includeContext === 'boolean') setIncludeContext(prefs.includeContext);
        if (typeof prefs.includeTable === 'boolean') setIncludeTable(prefs.includeTable);
        if (typeof prefs.chartOnSeparatePage === 'boolean') setChartOnSeparatePage(prefs.chartOnSeparatePage);
        if (typeof prefs.chartScale === 'number') setChartScale(Math.min(3, Math.max(1, prefs.chartScale)));
        if (typeof prefs.kpiOrderBy === 'string') setKpiOrderBy(prefs.kpiOrderBy);
        if (typeof prefs.reportTitle === 'string') setReportTitle(prefs.reportTitle);
        if (typeof prefs.logoDataUrl === 'string') setLogoDataUrl(prefs.logoDataUrl);
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    // Salvar preferências minimamente a cada mudança relevante
    try {
      localStorage.setItem('pdfPreviewPrefs', JSON.stringify({
        zoom,
        isFullscreen,
        includeChart,
        includeContext,
        includeTable,
        chartOnSeparatePage,
        chartScale,
        kpiOrderBy,
        reportTitle,
        logoDataUrl,
      }));
    } catch {}
  }, [zoom, isFullscreen, includeChart, includeContext, includeTable, chartOnSeparatePage, chartScale, kpiOrderBy, reportTitle, logoDataUrl]);

  // Ajusta overflow do body quando fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isFullscreen]);

  const generateAndSetPdf = useCallback(() => {
    const cacheKey = `${selectedTemplate}-${data.targetDate.toISOString()}`;
    if (pdfCacheRef.current.has(cacheKey)) {
      setPdfUrl(pdfCacheRef.current.get(cacheKey)!);
      setGenerationState({ isLoading: false, error: null, retryCount: 0 });
      return;
    }

    setGenerationState({ isLoading: true, error: null, retryCount: generationState.retryCount });
    
    // Usar setTimeout para garantir que a UI seja atualizada
    setTimeout(async () => {
        try {
          console.log('Gerando PDF para template:', selectedTemplate);
          console.log('Dados para PDF:', data);
          // Tenta capturar o gráfico, se existir na página atual
          let chartImageDataUrl: string | undefined;
          try {
            const node = document.getElementById('trend-chart-capture');
            if (node) {
              const html2canvas = (await import('html2canvas')).default;
              const canvas = await html2canvas(node, { scale: chartScale, backgroundColor: '#ffffff' });
              chartImageDataUrl = canvas.toDataURL('image/png');
            }
          } catch (capErr) {
            console.warn('Falha ao capturar grafico para PDF (seguindo sem imagem):', capErr);
          }

          const payload = {
            ...data,
            ...(chartImageDataUrl ? { chartImageDataUrl } : {}),
            reportOptions: {
              includeChart,
              includeContext,
              includeTable,
              chartOnSeparatePage,
              chartScale,
              kpiOrderBy,
            },
            reportMeta: {
              title: reportTitle,
              logoDataUrl,
            },
          };
          const url = generatePdf(selectedTemplate, payload);
            
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

  }, [selectedTemplate, data, pdfUrl, toast, generationState.retryCount, includeChart, includeContext, includeTable, chartOnSeparatePage, chartScale, kpiOrderBy, reportTitle, logoDataUrl]);

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

  // --- Atalhos de teclado: F (fullscreen), Esc (fechar), +/- (zoom), 0 (reset) ---
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(2, z + 0.25));
      } else if (e.key === '-') {
        setZoom(z => Math.max(0.5, z - 0.25));
      } else if (e.key === '0') {
        setZoom(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onOpenChange]);

  const applyPreset = (preset: 'graphOnly' | 'dataOnly' | 'full') => {
    if (preset === 'graphOnly') {
      setIncludeChart(true);
      setIncludeContext(false);
      setIncludeTable(false);
      setChartOnSeparatePage(true);
    } else if (preset === 'dataOnly') {
      setIncludeChart(false);
      setIncludeContext(true);
      setIncludeTable(true);
      setChartOnSeparatePage(false);
    } else {
      setIncludeChart(true);
      setIncludeContext(true);
      setIncludeTable(true);
      setChartOnSeparatePage(false);
    }
    try {
      const raw = localStorage.getItem('pdfPreviewPrefs');
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem('pdfPreviewPrefs', JSON.stringify({
        ...prev,
        includeChart: preset !== 'dataOnly',
        includeContext: preset !== 'graphOnly',
        includeTable: preset !== 'graphOnly',
        chartOnSeparatePage: preset === 'graphOnly',
      }));
    } catch {}
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
              title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
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

                {/* Presets */}
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
                  <Button variant="ghost" size="sm" onClick={() => applyPreset('graphOnly')} title="Somente Gráfico">
                    Somente Gráfico
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => applyPreset('dataOnly')} title="Somente Dados">
                    Somente Dados
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => applyPreset('full')} title="Completo">
                    Completo
                  </Button>
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

                {/* Preferências de conteúdo */}
                <div className="hidden md:flex items-center gap-3 pl-2 border-l border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox id="opt-chart" checked={includeChart} onCheckedChange={() => setIncludeChart(v => !v)} />
                    <Label htmlFor="opt-chart" className="text-sm">Gráfico</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="opt-context" checked={includeContext} onCheckedChange={() => setIncludeContext(v => !v)} />
                    <Label htmlFor="opt-context" className="text-sm">Contexto</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="opt-table" checked={includeTable} onCheckedChange={() => setIncludeTable(v => !v)} />
                    <Label htmlFor="opt-table" className="text-sm">Tabela</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="opt-chart-page" checked={chartOnSeparatePage} onCheckedChange={() => setChartOnSeparatePage(v => !v)} />
                    <Label htmlFor="opt-chart-page" className="text-sm">Gráfico em outra página</Label>
                  </div>
                </div>

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
