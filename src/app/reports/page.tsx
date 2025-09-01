
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
import { generateReport } from '@/lib/data-service';

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
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    toast({
      title: 'Gerando Relatório',
      description: 'Aguarde enquanto preparamos seu arquivo para download.',
    });

    try {
      const result = await generateReport({
        type: data.reportType,
        period: data.period,
        format: data.format,
      });
      
      if (result.fileContent) {
          const mimeType = data.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          const fileName = `relatorio_ucs_${data.reportType}_${data.period}.${data.format}`;

          const byteCharacters = atob(result.fileContent);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });

          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
              title: 'Download Iniciado',
              description: 'Seu relatório foi gerado com sucesso.',
          });
      } else {
          throw new Error('O conteúdo do arquivo não foi retornado pelo servidor.');
      }

    } catch (error) {
      console.error('Falha ao gerar relatório:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Gerar Relatório',
        description: 'Não foi possível gerar o arquivo. Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Relatórios" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>
                  Selecione os parâmetros abaixo para gerar e baixar relatórios de performance em formato Excel ou PDF.
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
                  <Button className="w-full sm:w-auto" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Gerar Relatório
                  </Button>
                </form>
              </CardContent>
            </Card>

             <div className="mt-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Seus Dados, Seu Controle</h3>
                <p className="mt-2 text-sm">
                    Utilize os relatórios para análises aprofundadas, compartilhamento com sua equipe ou para manter registros históricos da performance do Índice UCS e seus ativos subjacentes.
                </p>
             </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
