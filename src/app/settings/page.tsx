
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFormulaParameters, saveFormulaParameters } from '@/lib/formula-service';
import type { FormulaParameters } from '@/lib/types';


const formulaSchema = z.object({
    VOLUME_MADEIRA_HA: z.coerce.number(),
    FATOR_CARBONO: z.coerce.number(),
    PROD_BOI: z.coerce.number(),
    PROD_MILHO: z.coerce.number(),
    PROD_SOJA: z.coerce.number(),
    PESO_PEC: z.coerce.number(),
    PESO_MILHO: z.coerce.number(),
    PESO_SOJA: z.coerce.number(),
    FATOR_ARREND: z.coerce.number(),
    FATOR_AGUA: z.coerce.number(),
    FATOR_CONVERSAO_SERRADA_TORA: z.coerce.number(),
});


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('formula');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<FormulaParameters, 'isConfigured'>>({
      resolver: zodResolver(formulaSchema),
  });

  useEffect(() => {
    async function fetchParameters() {
      setIsFetching(true);
      try {
        const params = await getFormulaParameters();
        reset(params); // Load fetched data into the form
      } catch (error) {
        console.error("Failed to fetch formula parameters:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar parâmetros",
          description: "Não foi possível buscar as configurações da fórmula. Usando valores padrão.",
        });
      } finally {
        setIsFetching(false);
      }
    }
    fetchParameters();
  }, [reset, toast]);
  

  const onSubmit = async (data: Omit<FormulaParameters, 'isConfigured'>) => {
    setIsLoading(true);
    try {
      await saveFormulaParameters(data);
      toast({
        title: 'Fórmula Atualizada',
        description: 'Os parâmetros da fórmula do índice foram salvos com sucesso.',
      });
    } catch (error) {
      console.error('Error saving formula parameters:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar os parâmetros da fórmula. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    if (isFetching) {
      return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
      );
    }
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Parâmetros da Madeira */}
            <div>
                <h3 className="text-lg font-medium mb-4">Parâmetros da Madeira</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="VOLUME_MADEIRA_HA">Volume de Madeira por Hectare (m³)</Label>
                        <Input id="VOLUME_MADEIRA_HA" type="number" step="any" {...register('VOLUME_MADEIRA_HA')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_CONVERSAO_SERRADA_TORA">Fator Conversão Madeira (Serrada p/ Tora)</Label>
                        <Input id="FATOR_CONVERSAO_SERRADA_TORA" type="number" step="any" {...register('FATOR_CONVERSAO_SERRADA_TORA')} />
                    </div>
                </div>
            </div>
            
             {/* Uso do Solo (Agropecuária) */}
            <div>
                <h3 className="text-lg font-medium mb-4">Uso do Solo (Agropecuária)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="PROD_BOI">Produção de Boi (@/ha/ano)</Label>
                        <Input id="PROD_BOI" type="number" step="any" {...register('PROD_BOI')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PROD_SOJA">Produção de Soja (t/ha/ano)</Label>
                        <Input id="PROD_SOJA" type="number" step="any" {...register('PROD_SOJA')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PROD_MILHO">Produção de Milho (t/ha/ano)</Label>
                        <Input id="PROD_MILHO" type="number" step="any" {...register('PROD_MILHO')} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                     <div className="space-y-2">
                        <Label htmlFor="PESO_PEC">Peso da Pecuária (%)</Label>
                        <Input id="PESO_PEC" type="number" step="any" {...register('PESO_PEC')} placeholder="Ex: 0.35 para 35%" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PESO_SOJA">Peso da Soja (%)</Label>
                        <Input id="PESO_SOJA" type="number" step="any" {...register('PESO_SOJA')} placeholder="Ex: 0.35 para 35%" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PESO_MILHO">Peso do Milho (%)</Label>
                        <Input id="PESO_MILHO" type="number" step="any" {...register('PESO_MILHO')} placeholder="Ex: 0.30 para 30%" />
                    </div>
                </div>
            </div>

            {/* Fatores Gerais e Socioambientais */}
            <div>
                <h3 className="text-lg font-medium mb-4">Fatores Gerais e Socioambientais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_ARREND">Fator de Arrendamento (%)</Label>
                        <Input id="FATOR_ARREND" type="number" step="any" {...register('FATOR_ARREND')} placeholder="Ex: 0.048 para 4.8%" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_CARBONO">Fator de Carbono (tCO₂/m³)</Label>
                        <Input id="FATOR_CARBONO" type="number" step="any" {...register('FATOR_CARBONO')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_AGUA">Fator Água (% do VUS)</Label>
                        <Input id="FATOR_AGUA" type="number" step="any" {...register('FATOR_AGUA')} placeholder="Ex: 0.07 para 7%" />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Fórmula
            </Button>
        </form>
    )
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Configurações" />
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground">
              <a href="#" 
                onClick={() => setActiveTab('formula')}
                className={activeTab === 'formula' ? "font-semibold text-primary" : ""}>
                Fórmula do Índice
              </a>
              <a href="#" 
                 onClick={() => setActiveTab('sources')}
                 className={activeTab === 'sources' ? "font-semibold text-primary" : ""}>
                Fontes de Dados
              </a>
            </nav>
            <div className="grid gap-6">
              {activeTab === 'formula' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Parâmetros da Fórmula do Índice</CardTitle>
                        <CardDescription>
                            Ajuste os pesos, fatores e produtividades que compõem o cálculo do Índice UCS. As alterações aqui impactarão todos os cálculos do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderFormFields()}
                    </CardContent>
                </Card>
              )}
               {activeTab === 'sources' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Fontes de Dados</CardTitle>
                        <CardDescription>
                        Visualize as fontes de dados utilizadas para extração de cotações das commodities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">As fontes de dados são gerenciadas através da configuração do Yahoo Finance (`yahoo-finance-config-data.ts`) e não são editáveis através desta interface.</p>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
