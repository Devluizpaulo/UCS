'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { runScenarioSimulation } from '@/lib/data-service';
import type { ScenarioResult, SimulateScenarioInput } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const commodities = [
    { value: 'USD/BRL Histórico', label: 'USD/BRL Histórico' },
    { value: 'EUR/BRL Histórico', label: 'EUR/BRL Histórico' },
    { value: 'Boi Gordo Futuros', label: 'Boi Gordo Futuros' },
    { value: 'Soja Futuros', label: 'Soja Futuros' },
    { value: 'Milho Futuros', label: 'Milho Futuros' },
    { value: 'Madeira Futuros', label: 'Madeira Futuros' },
    { value: 'Carbono Futuros', label: 'Carbono Futuros' },
];

const scenarioSchema = z.object({
  asset: z.string().min(1, 'Selecione um ativo.'),
  changeType: z.enum(['percentage', 'absolute'], { required_error: 'Selecione o tipo de mudança.' }),
  value: z.coerce.number().refine(val => !isNaN(val) && val !== 0, 'Insira um valor válido e diferente de zero.'),
});


export function ScenarioAnalysis() {
    const [result, setResult] = useState<ScenarioResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { errors }, watch } = useForm<SimulateScenarioInput>({
        resolver: zodResolver(scenarioSchema),
    });

    const onSubmit = async (data: SimulateScenarioInput) => {
        setIsLoading(true);
        setResult(null);
        try {
            const scenarioResult = await runScenarioSimulation(data.asset, data.changeType, data.value);
            setResult(scenarioResult);
        } catch (error) {
            console.error('Scenario simulation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Erro na Simulação',
                description: 'Não foi possível completar a simulação. Tente novamente.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const selectedAssetLabel = commodities.find(c => c.value === watch('asset'))?.label;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Cenários</CardTitle>
        <CardDescription>Simule o impacto de diferentes cenários econômicos e de mercado no Índice UCS.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="asset">Ativo</Label>
                <Controller
                    name="asset"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="asset">
                                <SelectValue placeholder="Selecione um ativo" />
                            </SelectTrigger>
                            <SelectContent>
                                {commodities.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.asset && <p className="text-xs text-destructive">{errors.asset.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="change-type">Tipo de Mudança</Label>
                <Controller
                    name="changeType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="change-type">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Variação Percentual (%)</SelectItem>
                                <SelectItem value="absolute">Novo Valor Absoluto (R$)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.changeType && <p className="text-xs text-destructive">{errors.changeType.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="change-value">Valor</Label>
                <Input id="change-value" type="number" step="any" placeholder="ex: 10 ou -5" {...register('value')} />
                 {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            </div>
            <div className="flex justify-start">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simular Cenário
                </Button>
            </div>
        </form>

        {(isLoading || result) && (
            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium">Resultado da Simulação</h3>
                {isLoading ? (
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Calculando o impacto no índice. Por favor, aguarde...</p>
                    </div>
                ) : result && (
                    <>
                        <div className="mt-4 flex items-baseline gap-4">
                            <p className="text-4xl font-bold text-primary">{result.newIndexValue.toFixed(4)}</p>
                            <p className={`text-lg font-semibold ${result.changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ({result.changePercentage >= 0 ? '+' : ''}{result.changePercentage.toFixed(2)}%)
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                           Simulação baseada em uma alteração no preço de <span className="font-semibold">{selectedAssetLabel}</span>.
                           O valor original era <span className="font-semibold">R$ {result.originalAssetPrice.toFixed(4)}</span> e o índice era <span className="font-semibold">{result.originalIndexValue.toFixed(4)}</span>.
                        </p>
                    </>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
