
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid, format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { DateNavigator } from '@/components/date-navigator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, History, Edit, ExternalLink, Calculator, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCommodityConfigs, getQuoteByDate } from '@/lib/data-service';
import { recalculateAllForDate } from '@/lib/recalculation-service';
import type { CommodityConfig, CommodityPriceData, FirestoreQuote } from '@/lib/types';
import { getIconForCategory } from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AuditEditModal } from '@/components/admin/audit-edit-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


function getValidatedDate(dateString?: string | null): Date | null {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return null;
}

export type AssetItem = CommodityConfig & {
  quote: FirestoreQuote | null;
  status: 'OK' | 'FALTANDO';
  type: 'COTADO' | 'CALCULADO';
};

const CALCULATED_ASSET_IDS: string[] = ['vus', 'vmad', 'carbono_crs', 'Agua_CRS', 'valor_uso_solo', 'pdm', 'ucs', 'ucs_ase', 'custo_agua', 'ch2o_agua'];
const CURRENCY_ASSET_IDS = ['usd', 'eur'];
const BASE_ASSET_IDS = ['boi_gordo', 'milho', 'soja', 'madeira', 'carbono', 'ch2o_agua', 'custo_agua'];

export default function AuditPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [assetItems, setAssetItems] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [isRecalculateAlertOpen, setIsRecalculateAlertOpen] = useState(false);

  const fetchAssetItems = async (date: Date) => {
    setIsLoading(true);
    try {
      const configs = await getCommodityConfigs();
      const items = await Promise.all(
        configs.map(async (config) => {
          const quote = await getQuoteByDate(config.id, date);
          const localOverride = editedValues[config.id];
          const finalQuote = localOverride !== undefined && quote ? { ...quote, ultimo: localOverride, valor: localOverride } : quote;

          return {
            ...config,
            quote: finalQuote,
            status: quote ? ('OK' as const) : ('FALTANDO' as const),
            type: CALCULATED_ASSET_IDS.includes(config.id) ? ('CALCULADO' as const) : ('COTADO' as const),
          };
        })
      );
      
      const getGroup = (id: string) => {
        if (CURRENCY_ASSET_IDS.includes(id)) return 0; // Câmbio
        if (BASE_ASSET_IDS.includes(id)) return 1; // Ativos Base
        if (CALCULATED_ASSET_IDS.includes(id)) return 2; // Calculados
        return 3; // Outros
      };

      items.sort((a, b) => {
        const groupA = getGroup(a.id);
        const groupB = getGroup(b.id);
        if (groupA !== groupB) {
            return groupA - groupB;
        }
        return a.name.localeCompare(b.name);
      });
      
      setAssetItems(items);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados', description: err.message });
      setAssetItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialDate = getValidatedDate(dateParam) || new Date();
    setTargetDate(initialDate);
    setEditedValues({});
  }, [dateParam]);

  useEffect(() => {
    if (targetDate) {
      fetchAssetItems(targetDate);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const handleValueChange = (assetId: string, newValue: number) => {
    setEditedValues(prev => ({ ...prev, [assetId]: newValue }));
    setAssetItems(prevItems =>
      prevItems.map(item =>
        item.id === assetId
          ? { ...item, quote: { ...(item.quote as FirestoreQuote), ultimo: newValue, valor: newValue } }
          : item
      )
    );
  };
  
  const handleRecalculate = () => {
    if (!targetDate || Object.keys(editedValues).length === 0) return;
    setIsRecalculateAlertOpen(true);
  };

  const confirmRecalculate = () => {
    if (!targetDate) return;
    startTransition(async () => {
      const result = await recalculateAllForDate(targetDate, editedValues);
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setEditedValues({});
        fetchAssetItems(targetDate); // Refresh data
      } else {
        toast({ variant: 'destructive', title: 'Erro no Recálculo', description: result.message });
      }
    });
    setIsRecalculateAlertOpen(false);
  };

  if (!targetDate) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const formattedDate = format(targetDate, 'dd/MM/yyyy');
  const hasEdits = Object.keys(editedValues).length > 0;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader title="Auditoria de Dados" description={`Verifique, edite e recalcule os dados para ${formattedDate}`} icon={History}>
           <div className="flex items-center gap-2">
            <Button onClick={handleRecalculate} disabled={!hasEdits || isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar e Recalcular
            </Button>
            <DateNavigator targetDate={targetDate} />
           </div>
        </PageHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Ativos</CardTitle>
              <CardDescription>
                Visualize os valores de cada ativo para a data selecionada. Ativos cotados podem ser editados para disparar um recálculo em cascata.
              </CardDescription>
            </CardHeader>
            <CardContent>
             <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Registrado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-center"><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                      </TableRow>
                    ))
                  ) : assetItems.map((asset) => {
                    const Icon = getIconForCategory(asset as CommodityPriceData);
                    const principalValue = asset.quote?.valor ?? asset.quote?.ultimo ?? (asset.quote as any)?.valor_brl ?? 'N/A';
                    const isEdited = editedValues.hasOwnProperty(asset.id);

                    return (
                      <TableRow key={asset.id} className={cn(isEdited && 'bg-yellow-500/10', asset.type === 'COTADO' ? 'bg-muted/30' : '')}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                            <div className="font-medium">{asset.name}</div>
                             {isEdited && <Tooltip><TooltipTrigger asChild><AlertTriangle className="h-4 w-4 text-yellow-500" /></TooltipTrigger><TooltipContent><p>Valor editado</p></TooltipContent></Tooltip>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={asset.type === 'COTADO' ? 'default' : 'secondary'} className={cn(asset.type === 'CALCULADO' && 'bg-orange-500 text-white hover:bg-orange-600')}>{asset.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {typeof principalValue === 'number' ? formatCurrency(principalValue, asset.currency, asset.id) : principalValue}
                        </TableCell>
                        <TableCell>
                          <Badge variant={asset.status === 'OK' ? 'outline' : 'destructive'} className={cn(asset.status === 'OK' && 'border-green-500 text-green-600')}>{asset.status}</Badge>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center justify-center gap-1">
                                {asset.type === 'COTADO' ? (
                                <>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => setEditingAsset(asset)}>
                                        <Edit className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar Valor</p>
                                    </TooltipContent>
                                    </Tooltip>
                                    {asset.sourceUrl && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" asChild>
                                            <a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                        <p>Ver no site de origem</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    )}
                                </>
                                ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" disabled>
                                        <Calculator className="h-4 w-4" />
                                    </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>O valor é calculado automaticamente</p>
                                    </TooltipContent>
                                </Tooltip>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
             </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <AuditEditModal
        assetItem={editingAsset}
        allAssets={assetItems}
        isOpen={!!editingAsset}
        onOpenChange={() => setEditingAsset(null)}
        onSave={handleValueChange}
      />
      <AlertDialog open={isRecalculateAlertOpen} onOpenChange={setIsRecalculateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Recálculo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a sobrescrever os dados para <span className="font-bold">{formattedDate}</span> com base nos valores editados. Essa ação é irreversível e irá recalcular todos os índices dependentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRecalculate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Salvar e Recalcular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
