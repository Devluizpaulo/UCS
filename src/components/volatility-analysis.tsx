
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import * as React from 'react';
import { mean, standardDeviation, min, max } from 'simple-statistics';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Percent, Sigma } from 'lucide-react';
import { DateRangePicker } from './date-range-picker';
import { getCotacoesHistoricoPorRange } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityConfig, FirestoreQuote } from '@/lib/types';
import { getCommodityConfigs } from '@/lib/data-service';


const analysisSchema = z.object({
  assetId: z.string().min(1, { message: 'Selecione um ativo.' }),
  dateRange: z.object({
    from: z.date({ required_error: "Data de início é obrigatória." }),
    to: z.date({ required_error: "Data de fim é obrigatória." }),
  }),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

interface VolatilityStats {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    variationCoefficient: number;
}

export function VolatilityAnalysis() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [stats, setStats] = useState<VolatilityStats | null>(null);
  const [assets, setAssets] = useState<CommodityConfig[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CommodityConfig | null>(null);
  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      assetId: 'ucs_ase',
      dateRange: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
  });

  React.useEffect(() => {
    async function loadAssets() {
        const availableAssets = await getCommodityConfigs();
        setAssets(availableAssets);
        // Set initial selected asset
        const initialAsset = availableAssets.find(a => a.id === 'ucs_ase');
        if(initialAsset) setSelectedAsset(initialAsset);
    }
    loadAssets();
  }, []);

  const assetId = watch('assetId');

  React.useEffect(() => {
      const currentAsset = assets.find(a => a.id === assetId);
      if (currentAsset) setSelectedAsset(currentAsset);
  }, [assetId, assets]);


  React.useEffect(() => {
    if (date) {
        setValue('dateRange', date as { from: Date; to: Date; });
    }
  }, [date, setValue]);

  const processForm = async (data: AnalysisFormData) => {
    setIsCalculating(true);
    setStats(null);

    const historicalData: FirestoreQuote[] = await getCotacoesHistoricoPorRange(data.assetId, data.dateRange);

    if (historicalData.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Dados Insuficientes',
            description: 'Não há dados históricos suficientes no período selecionado para calcular a volatilidade.',
        });
        setIsCalculating(false);
        return;
    }

    const prices = historicalData.map(d => d.valor ?? d.ultimo).filter(p => typeof p === 'number');

    if (prices.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Dados Inválidos',
            description: 'Os dados históricos encontrados não contêm valores de preço válidos.',
        });
        setIsCalculating(false);
        return;
    }
    
    const meanPrice = mean(prices);
    const stdDeviation = standardDeviation(prices);
    
    setStats({
        mean: meanPrice,
        stdDev: stdDeviation,
        min: min(prices),
        max: max(prices),
        variationCoefficient: (stdDeviation / meanPrice) * 100,
    });
    
    setIsCalculating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit(processForm)}>
          <Card>
            <CardHeader>
              <CardTitle>Análise de Volatilidade</CardTitle>
              <CardDescription>
                Calcule a volatilidade de um ativo em um período específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="dateRange">Período de Análise</Label>
                 <DateRangePicker date={date} setDate={setDate} />
                 {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.from?.message || errors.dateRange.to?.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assetId">Ativo</Label>
                <Controller
                  name="assetId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.assetId && <p className="text-sm text-destructive">{errors.assetId.message}</p>}
              </div>
              <Button type="submit" disabled={isCalculating} className="w-full">
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Sigma className="mr-2 h-4 w-4" />
                      Calcular Volatilidade
                    </>
                  )}
                </Button>
            </CardContent>
          </Card>
        </form>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full min-h-[400px]">
           <CardHeader>
              <CardTitle>Resultados da Análise</CardTitle>
              <CardDescription>
                Métricas de volatilidade para o ativo e período selecionados.
              </CardDescription>
            </CardHeader>
          <CardContent>
            {isCalculating ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-semibold">Analisando dados históricos...</p>
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                             <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.mean, selectedAsset?.currency || 'BRL', selectedAsset?.id)}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Desvio Padrão</CardTitle>
                             <Sigma className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.stdDev, selectedAsset?.currency || 'BRL', selectedAsset?.id)}</div>
                             <p className="text-xs text-muted-foreground">Indica a dispersão dos preços em relação à média.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Coeficiente de Variação</CardTitle>
                             <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.variationCoefficient.toFixed(2)}%</div>
                             <p className="text-xs text-muted-foreground">Volatilidade relativa (Desvio Padrão / Média).</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Range de Preço</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">
                                {formatCurrency(stats.min, selectedAsset?.currency || 'BRL', selectedAsset?.id)} - {formatCurrency(stats.max, selectedAsset?.currency || 'BRL', selectedAsset?.id)}
                            </div>
                             <p className="text-xs text-muted-foreground">Preço mínimo e máximo no período.</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
                    <div className="text-center">
                        <Sigma className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-center text-muted-foreground">
                            Os resultados da sua análise aparecerão aqui.
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
