

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFormulaParameters, saveFormulaParameters } from '@/lib/formula-service';
import type { FormulaParameters, CommodityConfig } from '@/lib/types';
import { getCommodities, saveCommodity, deleteCommodity } from '@/lib/commodity-config-service';
import { CommoditySourcesTable } from '@/components/commodity-sources-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EditCommodityModal } from '@/components/edit-commodity-modal';
import { UserManagement } from '@/components/user-management';
import { CurrencyConversionTable } from '@/components/currency-conversion-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// Schema for the form fields, matching the core parameters
const formulaSchema = z.object({
    // Produtividades
    produtividade_boi: z.coerce.number().min(0, "Valor não pode ser negativo"),
    produtividade_milho: z.coerce.number().min(0, "Valor não pode ser negativo"),
    produtividade_soja: z.coerce.number().min(0, "Valor não pode ser negativo"),
    produtividade_madeira: z.coerce.number().min(0, "Valor não pode ser negativo"),
    produtividade_carbono: z.coerce.number().min(0, "Valor não pode ser negativo"),
    
    // Fatores de Ponderação
    fator_pecuaria: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    fator_milho: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    fator_soja: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    
    // Fatores de Conversão
    fator_arrendamento: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    fator_agua: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    fator_conversao_madeira: z.coerce.number().min(0).max(1, "Deve ser entre 0 e 1"),
    fator_ucs: z.coerce.number().min(0, "Valor não pode ser negativo"),
    FATOR_CARBONO: z.coerce.number().min(0, "Valor não pode ser negativo"),
    
    // Área
    area_total: z.coerce.number().min(0, "Valor não pode ser negativo"),
});


export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showFormulaAlert, setShowFormulaAlert] = useState(false);
  const { toast } = useToast();
  const [commodities, setCommodities] = useState<CommodityConfig[]>([]);
  const [editingCommodity, setEditingCommodity] = useState<CommodityConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingCommodityId, setDeletingCommodityId] = useState<string | null>(null);

  const formulaForm = useForm<z.infer<typeof formulaSchema>>({
      resolver: zodResolver(formulaSchema),
  });

  
  const fetchAllData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [formulaParams, comms] = await Promise.all([
          getFormulaParameters(),
          getCommodities()
      ]);
      formulaForm.reset(formulaParams);
      setCommodities(comms);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível buscar as configurações. Usando valores padrão.",
      });
    } finally {
      setIsFetching(false);
    }
  }, [toast, formulaForm]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleNewCommodity = () => {
    setEditingCommodity(null);
    setIsModalOpen(true);
  };

  const handleEditCommodity = (commodity: CommodityConfig) => {
    setEditingCommodity(commodity);
    setIsModalOpen(true);
  };

  const onFormulaSubmit = async (data: z.infer<typeof formulaSchema>) => {
    setIsLoading(true);
    setShowFormulaAlert(false);
    try {
      const currentParams = await getFormulaParameters();
      const fullParams: Omit<FormulaParameters, 'isConfigured'> = {
          ...currentParams, // Start with all existing params
          ...data, // Overwrite with form data
      };
      
      await saveFormulaParameters(fullParams);
      toast({
        title: 'Parâmetros Salvos',
        description: 'Os parâmetros da fórmula foram salvos. O índice será recalculado na próxima atualização.',
      });
      setShowFormulaAlert(true);
    } catch (error) {
      console.error('Error saving formula parameters:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar os parâmetros. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSourceSave = async (commodityData: CommodityConfig) => {
     setIsLoading(true);
     try {
        await saveCommodity(commodityData);
        toast({
            title: "Fonte de Dados Salva",
            description: `A configuração para ${commodityData.name} foi salva com sucesso.`
        });
        await fetchAllData(); // Refresh the list
     } catch(error) {
        console.error("Failed to save commodity config:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: `Não foi possível salvar a fonte de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
     } finally {
        setIsLoading(false);
        setIsModalOpen(false);
     }
  };

  const confirmDeleteCommodity = async () => {
    if (!deletingCommodityId) return;

    setIsLoading(true);
    try {
        await deleteCommodity(deletingCommodityId);
        toast({
            title: "Ativo Excluído",
            description: `O ativo foi removido do sistema.`
        });
        await fetchAllData(); // Refresh the list
    } catch(error) {
        console.error("Failed to delete commodity:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível remover o ativo.",
        });
    } finally {
        setIsLoading(false);
        setDeletingCommodityId(null);
    }
  };

  const renderFormulaForm = () => {
    if (isFetching) return <SettingsSkeleton />;
    return (
        <form onSubmit={formulaForm.handleSubmit(onFormulaSubmit)} className="space-y-4">
            {showFormulaAlert && (
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Parâmetros Salvos!</AlertTitle>
                    <AlertDescription>
                        Os parâmetros foram salvos. O índice será recalculado automaticamente na próxima atualização de dados.
                    </AlertDescription>
                </Alert>
            )}

            <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-medium">1. Produtividades (/ha)</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="produtividade_boi">Boi (@/ha)</Label>
                          <Input id="produtividade_boi" type="number" step="any" {...formulaForm.register('produtividade_boi')} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="produtividade_milho">Milho (ton/ha)</Label>
                          <Input id="produtividade_milho" type="number" step="any" {...formulaForm.register('produtividade_milho')} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="produtividade_soja">Soja (ton/ha)</Label>
                          <Input id="produtividade_soja" type="number" step="any" {...formulaForm.register('produtividade_soja')} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="produtividade_madeira">Madeira (FM3)</Label>
                          <Input id="produtividade_madeira" type="number" step="any" {...formulaForm.register('produtividade_madeira')} />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="produtividade_carbono">Média de CE (tCO₂e/ha)</Label>
                          <Input id="produtividade_carbono" type="number" step="any" {...formulaForm.register('produtividade_carbono')} />
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-medium">2. Fatores (%) e Multiplicadores</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="fator_pecuaria">Ponderação Pecuária (VUS)</Label>
                          <Input id="fator_pecuaria" type="number" step="any" {...formulaForm.register('fator_pecuaria')} placeholder="Ex: 0.35 para 35%" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="fator_milho">Ponderação Milho (VUS)</Label>
                          <Input id="fator_milho" type="number" step="any" {...formulaForm.register('fator_milho')} placeholder="Ex: 0.30 para 30%" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="fator_soja">Ponderação Soja (VUS)</Label>
                          <Input id="fator_soja" type="number" step="any" {...formulaForm.register('fator_soja')} placeholder="Ex: 0.35 para 35%" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="fator_arrendamento">Fator Arrendamento</Label>
                          <Input id="fator_arrendamento" type="number" step="any" {...formulaForm.register('fator_arrendamento')} placeholder="Ex: 0.048 para 4.8%" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="fator_agua">Custo da Água (CRS)</Label>
                          <Input id="fator_agua" type="number" step="any" {...formulaForm.register('fator_agua')} placeholder="Ex: 0.07 para 7%" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="fator_conversao_madeira">Conversão Madeira</Label>
                          <Input id="fator_conversao_madeira" type="number" step="any" {...formulaForm.register('fator_conversao_madeira')} placeholder="Ex: 0.10 para 10%" />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="fator_ucs">Fator Multiplicador UCS ASE</Label>
                          <Input id="fator_ucs" type="number" step="any" {...formulaForm.register('fator_ucs')} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="FATOR_CARBONO">Unidades de Carbono (CRS)</Label>
                          <Input id="FATOR_CARBONO" type="number" step="any" {...formulaForm.register('FATOR_CARBONO')} placeholder="Ex: 2.59" />
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-medium">3. Área Total</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                      <div className="space-y-2">
                          <Label htmlFor="area_total">Área Total (ha)</Label>
                          <Input id="area_total" type="number" step="any" {...formulaForm.register('area_total')} />
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button type="submit" disabled={isLoading} className="mt-6">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Parâmetros
            </Button>
        </form>
    );
  };
  
  const renderSourcesTab = () => {
    return (
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
               <div>
                    <CardTitle>Fontes de Dados dos Ativos</CardTitle>
                    <CardDescription>
                    Gerencie os ativos que compõem o índice.
                    </CardDescription>
               </div>
                <Button onClick={handleNewCommodity}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Ativo
                </Button>
           </CardHeader>
           <CardContent>
              <CommoditySourcesTable 
                data={commodities} 
                loading={isFetching}
                onEdit={handleEditCommodity}
                onDelete={(id) => setDeletingCommodityId(id)}
              />
           </CardContent>
       </Card>
     );
  }


  return (
    <MainLayout>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Configurações" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <Tabs defaultValue="formula" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="formula">Fórmula do Índice</TabsTrigger>
              <TabsTrigger value="sources">Fontes de Dados</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="currency">Conversão de Moedas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formula">
                <Card>
                    <CardHeader>
                        <CardTitle>Parâmetros da Fórmula do Índice</CardTitle>
                        <CardDescription>
                            Ajuste os pesos, fatores e produtividades que compõem o cálculo do Índice UCS. As alterações aqui impactarão todos os cálculos do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderFormulaForm()}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="sources">
                 {renderSourcesTab()}
            </TabsContent>

            <TabsContent value="users">
                <UserManagement />
            </TabsContent>
            
             <TabsContent value="currency">
                <Card>
                  <CardHeader>
                    <CardTitle>Sistema de Conversão de Moedas</CardTitle>
                    <CardDescription>
                      Visualize e teste o sistema de conversão de moedas implementado no projeto. 
                      Esta funcionalidade permite converter preços entre BRL, USD e EUR usando as taxas de câmbio atuais.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CurrencyConversionTable />
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

       {isModalOpen && (
            <EditCommodityModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              commodity={editingCommodity}
              onSave={handleSourceSave}
              isSaving={isLoading}
            />
        )}
        
        <AlertDialog open={!!deletingCommodityId} onOpenChange={() => setDeletingCommodityId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o ativo e seus dados históricos do sistema.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingCommodityId(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteCommodity} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </MainLayout>
  );
}


function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
