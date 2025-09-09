
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
import { useRouter } from 'next/navigation';


const formulaSchema = z.object({
    // VUS
    PROD_BOI: z.coerce.number(),
    PROD_MILHO: z.coerce.number(),
    PROD_SOJA: z.coerce.number(),
    PESO_PEC: z.coerce.number(),
    PESO_MILHO: z.coerce.number(),
    PESO_SOJA: z.coerce.number(),
    FATOR_ARREND: z.coerce.number(),
    // VMAD
    VOLUME_MADEIRA_HA: z.coerce.number(),
    FATOR_CONVERSAO_SERRADA_TORA: z.coerce.number(),
    // CRS
    FATOR_CARBONO: z.coerce.number(),
    FATOR_AGUA: z.coerce.number(),
});


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showFormulaAlert, setShowFormulaAlert] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [commodities, setCommodities] = useState<CommodityConfig[]>([]);
  const [editingCommodity, setEditingCommodity] = useState<CommodityConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingCommodityId, setDeletingCommodityId] = useState<string | null>(null);

  const formulaForm = useForm<Omit<FormulaParameters, 'isConfigured'>>({
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

  const onFormulaSubmit = async (data: Omit<FormulaParameters, 'isConfigured'>) => {
    setIsLoading(true);
    setShowFormulaAlert(false);
    try {
      await saveFormulaParameters(data);
      toast({
        title: 'Fórmula Atualizada',
        description: 'Os parâmetros da fórmula foram salvos. O índice será recalculado na próxima atualização de dados.',
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
        <form onSubmit={formulaForm.handleSubmit(onFormulaSubmit)} className="space-y-8">
            {showFormulaAlert && (
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Parâmetros Salvos!</AlertTitle>
                    <AlertDescription>
                        Os parâmetros foram salvos. O índice será recalculado automaticamente na próxima vez que os dados do n8n forem recebidos.
                    </AlertDescription>
                </Alert>
            )}

            {/* VUS Section */}
            <div>
                <h3 className="text-lg font-medium mb-4">1. Valor de Uso da Terra (VUS)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile-form-grid sm:grid-cols-2 lg:grid-cols-3">
                     <div className="space-y-2">
                        <Label htmlFor="PROD_BOI">Produção Boi (@/ha/ano)</Label>
                        <Input id="PROD_BOI" type="number" step="any" {...formulaForm.register('PROD_BOI')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PROD_SOJA">Produção Soja (t/ha/ano)</Label>
                        <Input id="PROD_SOJA" type="number" step="any" {...formulaForm.register('PROD_SOJA')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PROD_MILHO">Produção Milho (t/ha/ano)</Label>
                        <Input id="PROD_MILHO" type="number" step="any" {...formulaForm.register('PROD_MILHO')} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mobile-form-grid sm:grid-cols-2 lg:grid-cols-4">
                     <div className="space-y-2">
                        <Label htmlFor="PESO_PEC">Peso Pecuária (%)</Label>
                        <Input id="PESO_PEC" type="number" step="any" {...formulaForm.register('PESO_PEC')} placeholder="Ex: 0.35 para 35%" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PESO_SOJA">Peso Soja (%)</Label>
                        <Input id="PESO_SOJA" type="number" step="any" {...formulaForm.register('PESO_SOJA')} placeholder="Ex: 0.35 para 35%" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="PESO_MILHO">Peso Milho (%)</Label>
                        <Input id="PESO_MILHO" type="number" step="any" {...formulaForm.register('PESO_MILHO')} placeholder="Ex: 0.30 para 30%" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="FATOR_ARREND">Fator de Arrendamento (%)</Label>
                        <Input id="FATOR_ARREND" type="number" step="any" {...formulaForm.register('FATOR_ARREND')} placeholder="Ex: 0.048 para 4.8%" />
                    </div>
                </div>
            </div>

            {/* VMAD Section */}
            <div>
                <h3 className="text-lg font-medium mb-4">2. Valor da Madeira (VMAD)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mobile-form-grid md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="VOLUME_MADEIRA_HA">Fator m³ (Volume Madeira/ha)</Label>
                        <Input id="VOLUME_MADEIRA_HA" type="number" step="any" {...formulaForm.register('VOLUME_MADEIRA_HA')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_CONVERSAO_SERRADA_TORA">Fator Conversão Madeira (%)</Label>
                        <Input id="FATOR_CONVERSAO_SERRADA_TORA" type="number" step="any" {...formulaForm.register('FATOR_CONVERSAO_SERRADA_TORA')} placeholder="Ex: 0.10 para 10%" />
                    </div>
                </div>
            </div>
            
            {/* CRS Section */}
            <div>
                <h3 className="text-lg font-medium mb-4">3. Custo da Responsabilidade Socioambiental (CRS)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile-form-grid sm:grid-cols-2 lg:grid-cols-3">
                     <div className="space-y-2">
                        <Label htmlFor="FATOR_CARBONO">Fator Crédito de Carbono</Label>
                        <Input id="FATOR_CARBONO" type="number" step="any" {...formulaForm.register('FATOR_CARBONO')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="FATOR_AGUA">Fator Água (% do VUS)</Label>
                        <Input id="FATOR_AGUA" type="number" step="any" {...formulaForm.register('FATOR_AGUA')} placeholder="Ex: 0.07 para 7%" />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={isLoading}>
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
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-6 grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
            <nav className="grid gap-4 text-sm text-muted-foreground md:sticky md:top-20 mobile-nav md:grid">
              <a href="#" 
                 onClick={() => setActiveTab('users')}
                 className={activeTab === 'users' ? "font-semibold text-primary" : ""}>
                Usuários
              </a>
              <a href="#" 
                 onClick={() => setActiveTab('sources')}
                 className={activeTab === 'sources' ? "font-semibold text-primary" : ""}>
                Fontes de Dados
              </a>
              <a href="#" 
                onClick={() => setActiveTab('formula')}
                className={activeTab === 'formula' ? "font-semibold text-primary" : ""}>
                Fórmula do Índice
              </a>
              <a href="#" 
                onClick={() => setActiveTab('currency')}
                className={activeTab === 'currency' ? "font-semibold text-primary" : ""}>
                Conversão de Moedas
              </a>
            </nav>
            <div className="grid gap-6">
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'formula' && (
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
              )}
               {activeTab === 'sources' && renderSourcesTab()}
              {activeTab === 'currency' && (
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
              )}
            </div>
          </div>
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
