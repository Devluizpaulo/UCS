
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, formatISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, FileDown, FileText } from 'lucide-react';
import { DateRangePicker } from './date-range-picker';
import { Separator } from './ui/separator';
import { generateReport, type ReportInput, type ReportOutput } from '@/ai/flows/report-flow';
import { useToast } from '@/hooks/use-toast';

const reportSchema = z.object({
  assetId: z.string().min(1, { message: 'Selecione um ativo.' }),
  dateRange: z.object({
    from: z.date({ required_error: "Data de início é obrigatória." }),
    to: z.date({ required_error: "Data de fim é obrigatória." }),
  }),
  userPrompt: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportOutput | null>(null);
  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      assetId: 'ucs_ase',
      dateRange: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
      userPrompt: '',
    },
  });

  React.useEffect(() => {
    if (date) {
        setValue('dateRange', date as { from: Date; to: Date; });
    }
  }, [date, setValue]);

  const processForm = async (data: ReportFormData) => {
    setIsGenerating(true);
    setReportResult(null);

    const result = await generateReport(data);

    if (result.executiveSummary.startsWith('Erro:')) {
      toast({
        variant: 'destructive',
        title: 'Falha na Geração do Relatório',
        description: result.executiveSummary,
      });
    } else {
       setReportResult(result);
    }
    
    setIsGenerating(false);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna de Configuração */}
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit(processForm)}>
          <Card>
            <CardHeader>
              <CardTitle>Configurar Relatório</CardTitle>
              <CardDescription>
                Selecione os parâmetros para gerar sua análise executiva.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="dateRange">Período de Análise</Label>
                 <DateRangePicker date={date} setDate={setDate} />
                 {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.from?.message || errors.dateRange.to?.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assetId">Ativo Principal</Label>
                <Controller
                  name="assetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ucs_ase">Índice UCS ASE</SelectItem>
                        <SelectItem value="soja">Soja</SelectItem>
                        <SelectItem value="milho">Milho</SelectItem>
                        <SelectItem value="boi_gordo">Boi Gordo</SelectItem>
                        <SelectItem value="carbono">Crédito de Carbono</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.assetId && <p className="text-sm text-destructive">{errors.assetId.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="userPrompt">Observações e Perguntas (Opcional)</Label>
                 <Textarea
                  id="userPrompt"
                  placeholder="Ex: 'Analisar o impacto da nova regulação sobre o crédito de carbono no período.' ou 'Qual foi o dia de maior volatilidade?'"
                  className="min-h-[100px]"
                  {...control.register('userPrompt')}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Relatório com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Coluna de Resultado */}
      <div className="lg:col-span-2">
        <Card className="h-full min-h-[600px]">
           <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>
                Visualize o resumo da IA e faça o download do relatório completo.
              </CardDescription>
            </CardHeader>
          <CardContent>
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-semibold">Aguarde, nossa IA está analisando os dados...</p>
                    <p className="text-sm text-muted-foreground max-w-sm">Isso pode levar alguns instantes. Estamos compilando o histórico de preços, calculando métricas e gerando a análise textual.</p>
                </div>
            ) : reportResult ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Resumo Executivo
                        </h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 text-sm">
                            <p>{reportResult.executiveSummary}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Análise de Tendência</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 text-sm">
                            <p>{reportResult.trendAnalysis}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Análise de Volatilidade</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 text-sm">
                            <p>{reportResult.volatilityAnalysis}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Conclusão</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-4 text-sm">
                            <p>{reportResult.conclusion}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col items-center justify-center text-center bg-muted/30 border-2 border-dashed rounded-lg p-8">
                         <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Geração de PDF (Em Breve)</h3>
                        <p className="text-sm text-muted-foreground mb-4">A funcionalidade para baixar o relatório completo em PDF será implementada em breve.</p>
                        <Button disabled>
                            <FileDown className="mr-2 h-4 w-4" />
                            Baixar PDF
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
                    <div className="text-center">
                        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-center text-muted-foreground">
                            O resultado da sua análise aparecerá aqui.
                        </p>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
