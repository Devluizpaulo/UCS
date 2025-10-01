
'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { History, Info, Loader2 } from 'lucide-react';
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
import { reprocessDate } from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    const [isPending, startTransition] = useTransition();

    const [targetDate, setTargetDate] = useState<Date | null>(null);

     useEffect(() => {
        const initialDate = getValidatedDate(dateParam) || new Date();
        setTargetDate(initialDate);
    }, [dateParam]);


    const handleReprocess = async () => {
        if (!targetDate) return;

        startTransition(async () => {
            const result = await reprocessDate(targetDate);
            if (result.success) {
                toast({
                    title: "Reprocessamento Iniciado",
                    description: result.message,
                });
                // Aguarda um pouco e redireciona para a página do painel para ver os resultados
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
                description="Ferramenta para corrigir e recalcular dados históricos."
                icon={History}
            >
                <DateNavigator targetDate={targetDate} />
            </PageHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Como usar a ferramenta de auditoria</AlertTitle>
                    <AlertDescription>
                        Esta página permite acionar um recálculo completo dos dados para uma data específica. Isso é útil para corrigir erros de importação (n8n).
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li><b>Selecione a data</b> que precisa ser corrigida no navegador de datas acima.</li>
                            <li><b>Altere o valor manualmente no seu banco de dados</b> (ex: via Console do Firebase) para o ativo que foi importado incorretamente.</li>
                            <li>Clique no botão <b>"Reprocessar Cálculos do Dia"</b> abaixo.</li>
                            <li>A plataforma irá acionar o n8n para recalcular todos os índices dependentes com base no novo valor que você inseriu.</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Reprocessar Dados para {formattedDate}</CardTitle>
                        <CardDescription>
                            Esta ação irá disparar o fluxo de trabalho do n8n para buscar novamente as cotações-base e recalcular todos os índices e valores para o dia selecionado. Quaisquer dados existentes para este dia serão sobrescritos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive"
                                    disabled={isPending || isCurrentOrFuture}
                                >
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
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
                                        disabled={isPending}
                                    >
                                        Sim, Entendi e Quero Reprocessar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
