
'use server';

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

export default async function AssetsPage() {
    const assets = await getCommodityConfigs();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader 
                title="Gerenciar Ativos"
                description="Adicione, edite ou remova os ativos monitorados pela plataforma."
                icon={Archive}
            >
                <Button>Adicionar Novo Ativo</Button>
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
                                {assets.map((asset) => {
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
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
