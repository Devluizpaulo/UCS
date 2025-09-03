
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { GenerateReportInput, GenerateReportOutput } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { ReportPreviewModal } from '@/components/report-preview-modal';


async function generateReport(input: GenerateReportInput) {
  const { generateReport } = await import('@/ai/flows/generate-report-flow');
  return generateReport(input);
}


const reportSchema = z.object({
  reportType: z.enum(['index_performance', 'asset_performance'], {
    required_error: 'Selecione o tipo de relatório.',
  }),
  period: z.enum(['daily', 'monthly', 'yearly'], {
    required_error: 'Selecione o período.',
  }),
  format: z.enum(['xlsx', 'pdf'], {
    required_error: 'Selecione o formato do arquivo.',
  }),
  observations: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reportData, setReportData] = useState<GenerateReportOutput | null>(null);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    setReportData(null);
    toast({
      title: 'Gerando Pré-visualização',
      description: 'Aguarde enquanto a IA analisa os dados. Isso pode levar alguns segundos.',
    });

    try {
      const result = await generateReport({
        type: data.reportType,
        period: data.period,
        format: data.format,
        observations: data.observations,
      });
      
      setReportData(result);

    } catch (error) {
      console.error('Falha ao gerar relatório:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Gerar Relatório',
        description: 'Não foi possível gerar a pré-visualização. Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  const handleDownload = () => {
    if (!reportData) return;

    try {
        const blob = base64ToBlob(reportData.fileContent, reportData.mimeType);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = reportData.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: 'Download Iniciado',
            description: 'Seu relatório foi baixado com sucesso.',
        });
        setReportData(null); // Close modal on download
    } catch(e) {
         toast({
            variant: 'destructive',
            title: 'Erro no Download',
            description: 'Ocorreu um erro ao tentar baixar o arquivo.',
        });
    }
  };

  const handleShare = async () => {
     if (!reportData) return;
     if (!navigator.share) {
        toast({
            variant: 'destructive',
            title: 'Navegador não suportado',
            description: 'Seu navegador não suporta a função de compartilhamento.'
        });
        return;
     }

     setIsSharing(true);
     try {
        const blob = base64ToBlob(reportData.fileContent, reportData.mimeType);
        const file = new File([blob], reportData.fileName, { type: reportData.mimeType });
        
        const shareData = {
            title: reportData.previewData.reportTitle,
            text: reportData.previewData.analysisText,
            files: [file],
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
             toast({
                title: 'Relatório Compartilhado',
                description: 'Seu relatório foi enviado com sucesso.',
            });
        } else {
            throw new Error('Não é possível compartilhar este tipo de arquivo.');
        }

     } catch(err: any) {
        // Avoid showing an error if the user closes the share sheet
        if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            toast({
                variant: 'destructive',
                title: 'Falha ao Compartilhar',
                description: err.message || 'Ocorreu um erro ao tentar compartilhar o arquivo.'
            });
        }
     } finally {
        setIsSharing(false);
     }
  }


  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Relatórios" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados com Análise de IA</CardTitle>
                <CardDescription>
                  Selecione os parâmetros e adicione observações para que a IA gere uma análise para o seu relatório.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Tipo de Relatório</Label>
                      <Controller
                        name="reportType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="reportType">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="index_performance">Performance do Índice</SelectItem>
                              <SelectItem value="asset_performance">Performance dos Ativos</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.reportType && <p className="text-xs text-destructive">{errors.reportType.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period">Período</Label>
                      <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="period">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Diário (Últimos 30 dias)</SelectItem>
                              <SelectItem value="monthly">Mensal (Últimos 12 meses)</SelectItem>
                              <SelectItem value="yearly">Anual (Últimos 5 anos)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.period && <p className="text-xs text-destructive">{errors.period.message}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="format">Formato</Label>
                       <Controller
                        name="format"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="format">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.format && <p className="text-xs text-destructive">{errors.format.message}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações (Opcional)</Label>
                    <Textarea 
                        id="observations"
                        placeholder="Ex: Focar na volatilidade do milho devido à quebra de safra e como isso impactou o índice."
                        {...register('observations')}
                        className="min-h-[100px]"
                    />
                  </div>

                  <Button className="w-full sm:w-auto" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Gerar Pré-visualização
                  </Button>
                </form>
              </CardContent>
            </Card>

             <div className="mt-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Seus Dados, Sua Análise</h3>
                <p className="mt-2 text-sm">
                    Utilize os relatórios para análises aprofundadas, compartilhamento com sua equipe ou para manter registros históricos da performance do Índice UCS e seus ativos subjacentes.
                </p>
             </div>
          </div>
        </main>
      </div>
      
      {reportData && (
          <ReportPreviewModal 
            isOpen={!!reportData} 
            onClose={() => setReportData(null)}
            previewData={reportData.previewData}
            onDownload={handleDownload}
            onShare={handleShare}
            format={reportData.fileName.split('.').pop() as 'pdf' | 'xlsx'}
            isSharing={isSharing}
          />
      )}

    </MainLayout>
  );
}
