
'use client';

import { useState, useEffect } from 'react';
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
import { getCommodityConfigs, saveCommodityConfig } from '@/lib/data-service';
import { getIconForCategory } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { AssetFormModal } from '@/components/asset-form-modal';
import type { CommodityConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function useAssets() {
    const [assets, setAssets] = useState<CommodityConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const data = await getCommodityConfigs();
            setAssets(data);
            setError(null);
        } catch (err) {
            setError('Falha ao carregar os ativos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    return { assets, loading, error, refresh: fetchAssets };
}


export default function AssetsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { assets, loading, error, refresh } = useAssets();
    const { toast } = useToast();


    const handleAssetCreate = async (values: Omit<CommodityConfig, 'price' | 'change' | 'absoluteChange' | 'lastUpdated'>) => {
        try {
            await saveCommodityConfig(values.id, values);
            toast({
                title: "Ativo Salvo com Sucesso!",
                description: `O ativo "${values.name}" foi adicionado.`,
            });
            setIsModalOpen(false);
            refresh();
        } catch (err: any) {
            console.error("Falha ao criar ativo:", err);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Ativo",
                description: err.message || "Não foi possível adicionar o ativo. Tente novamente.",
            });
        }
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
                                ) : error ? (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-destructive">
                                            {error}
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
                                                    <Button variant="ghost" size="sm" disabled>
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
