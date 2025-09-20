

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/main-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import type { CommodityConfig } from '@/lib/types';
import { getCommodities, saveCommodity, deleteCommodity } from '@/lib/commodity-config-service';
import { CommoditySourcesTable } from '@/components/commodity-sources-table';
import { EditCommodityModal } from '@/components/edit-commodity-modal';
import { UserManagement } from '@/components/user-management';
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
import { Loader2 } from 'lucide-react';


export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const [commodities, setCommodities] = useState<CommodityConfig[]>([]);
  const [editingCommodity, setEditingCommodity] = useState<CommodityConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingCommodityId, setDeletingCommodityId] = useState<string | null>(null);
  
  const fetchAllData = useCallback(async () => {
    setIsFetching(true);
    try {
      const comms = await getCommodities();
      setCommodities(comms);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível buscar as configurações.",
      });
    } finally {
      setIsFetching(false);
    }
  }, [toast]);

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
          <Tabs defaultValue="sources" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sources">Fontes de Dados</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>
            
             <TabsContent value="sources">
                 {renderSourcesTab()}
            </TabsContent>

            <TabsContent value="users">
                <UserManagement />
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
