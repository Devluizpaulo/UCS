
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Archive } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCommodityConfigs } from '@/lib/data-service';
import { getIconForCategory } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { AssetFormModal } from '@/components/asset-form-modal';
import type { CommodityPriceData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Mock data fetching hook
function useAssets() {
    const [assets, setAssets] = useState<CommodityPriceData[]>([]);
    const [loading, setLoading] = useState(true);

    useState(() => {
        getCommodityConfigs().then(data => {
            setAssets(data);
            setLoading(false);
        });
    });

    return { assets, loading };
}


export default function AssetsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { assets, loading } = useAssets();
    const { toast } = useToast();
    const router = useRouter();


    const handleAssetCreate = async (values: any) => {
        console.log('Novo ativo a ser criado:', values);
        // Aqui iria a lógica para salvar o novo ativo no Firestore
        // e/ou atualizar um arquivo de configuração via API.
        
        // Por enquanto, apenas exibimos uma notificação e fechamos o modal.
        toast({
            title: "Ativo Criado com Sucesso!",
            description: `O ativo "${values.name}" foi adicionado.`,
        });
        setIsModalOpen(false);
        // Simulando o refresh da lista
        router.refresh(); 
    };

    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader 
                title="Gerenciar Ativos"
                description="Adicione, edite ou remova os ativos monitorados pela plataforma."
                icon={Archive}
            >
                <Button onClick={() => setIsModalOpen(true)}>Adicionar Novo Ativo</Button>
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ativos Configurados</CardTitle>
                        <CardDescription>
                            A lista de todos os ativos, incluindo commodities e índices, que estão configurados no sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ativo</TableHead>
                                    <TableHead>ID da Coleção</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Carregando ativos...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assets.map((asset) => {
                                        const Icon = getIconForCategory(asset);
                                        return (
                                            <TableRow key={asset.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="font-medium">{asset.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{asset.id}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{asset.category.toUpperCase()}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">
                                                        Editar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
            <AssetFormModal 
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleAssetCreate}
            />
        </div>
    );
}
