'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { History, Info, Loader2, ExternalLink } from 'lucide-react';
import { DateNavigator } from '@/components/date-navigator';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { isToday, isFuture, parseISO, isValid, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { reprocessDate, getCommodityPricesByDate } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';

function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

export default function AuditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const { toast } = useToast();
    const [isReprocessing, startReprocessingTransition] = useTransition();

    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [dailyData, setDailyData] = useState<CommodityPriceData[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);

    useEffect(() => {
        if (targetDate) {
            setIsLoadingData(true);
            getCommodityPricesByDate(targetDate)
                .then(setDailyData)
                .catch(err => {
                    toast({ variant: 'destructive', title: 'Erro ao buscar dados', description: err.message });
                    setDailyData([]);
                })
                .finally(() => setIsLoadingData(false));
        }
    }, [targetDate, toast]);


    const handleReprocess = async () => {
        if (!targetDate) return;

        startReprocessingTransition(async () => {
            const result = await reprocessDate(targetDate);
            if (result.success) {
                toast({
                    title: "Reprocessamento Iniciado",
                    description: result.message,
                });
                 setTimeout(() => {
                    const formattedDate = format(targetDate, 'yyyy-MM-dd');
                    router.push(`/dashboard?date=${formattedDate}`);
                }, 3000); 
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Falha no Reprocessamento",
                    description: result.message,
                });
            }
        });
    }

    if (!targetDate) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    const formattedDate = format(targetDate, 'dd/MM/yyyy');
    const isCurrentOrFuture = isToday(targetDate) || isFuture(targetDate);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <PageHeader
                title="Auditoria de Dados"
                description="Ferramenta para verificar e recalcular dados históricos."
                icon={History}
            >
                <DateNavigator targetDate={targetDate} />
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Fluxo de Correção de Dados</AlertTitle>
                    <AlertDescription>
                        Use esta ferramenta para corrigir dados que foram importados incorretamente pelo n8n.
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li><b>Selecione a data</b> que precisa ser corrigida no navegador acima.</li>
                            <li>Use o link "Ver Fonte" na tabela para conferir o valor correto do ativo no site de origem.</li>
                            <li><b>Altere o valor manualmente no seu banco de dados</b> (ex: via Console do Firebase) para o ativo incorreto.</li>
                            <li>Clique no botão <b>"Reprocessar Cálculos do Dia"</b>.</li>
                            <li>A plataforma irá acionar o n8n para recalcular todos os índices dependentes com base no novo valor que você inseriu.</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Auditoria de Dados para {formattedDate}</CardTitle>
                            <CardDescription>
                                Verifique os valores registrados para cada ativo e inicie um recálculo se necessário.
                            </CardDescription>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive"
                                    disabled={isReprocessing || isCurrentOrFuture}
                                    className="mt-4 md:mt-0"
                                >
                                    {isReprocessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                                    Reprocessar Cálculos do Dia
                                </Button>
                            </AlertDialogTrigger>
                             {isCurrentOrFuture && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    O reprocessamento só pode ser feito para datas passadas.
                                </p>
                            )}
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação é irreversível e irá acionar um processo custoso no servidor. Confirme que você já alterou os dados base necessários no banco de dados para a data <span className="font-bold">{formattedDate}</span> antes de prosseguir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={handleReprocess} 
                                        disabled={isReprocessing}
                                    >
                                        Sim, Entendi e Quero Reprocessar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ativo</TableHead>
                                    <TableHead className="text-right">Valor Registrado</TableHead>
                                    <TableHead className="text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingData ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                                            <TableCell className="text-center"><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : dailyData.length > 0 ? (
                                    dailyData.map((asset) => {
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
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(asset.price, asset.currency, asset.id)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {asset.sourceUrl && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="mr-2 h-4 w-4" /> Ver Fonte
                                                        </a>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            Nenhum dado encontrado para esta data.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
