'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2, Save } from 'lucide-react';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import * as Calc from '@/lib/calculation-service';
import { recalculateAllForDate } from '@/lib/recalculation-service';
import { isValid, parseISO } from 'date-fns';
import { DateNavigator } from '@/components/date-navigator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { AssetActions } from '@/components/admin/asset-actions';
import { AssetEditModal } from '@/components/admin/asset-edit-modal';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';


function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

const AssetActionTable = ({ 
    assets, 
    onEdit, 
    editedValues 
}: { 
    assets: (CommodityPriceData & { rentMediaCalculada?: number })[];
    onEdit: (asset: CommodityPriceData) => void;
    editedValues: Record<string, number>;
}) => {
  if (assets.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Nenhum ativo nesta categoria.
      </div>
    );
  }

  const hasRentMedia = assets.some(a => a.rentMediaCalculada !== undefined);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ativo</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {hasRentMedia && <TableHead className="text-right">Rentabilidade Média</TableHead>}
          <TableHead className="text-center w-[150px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow 
            key={asset.id} 
            className={cn(editedValues[asset.id] !== undefined && 'bg-yellow-500/10 hover:bg-yellow-500/20')}
          >
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </TableCell>
            {hasRentMedia && (
                <TableCell className="text-right font-mono">
                    {asset.rentMediaCalculada !== undefined 
                        ? formatCurrency(asset.rentMediaCalculada, 'BRL', 'rentabilidade') 
                        : 'N/A'
                    }
                </TableCell>
            )}
            <TableCell className="flex justify-center">
              <AssetActions asset={asset} onEdit={() => onEdit(asset)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const IndexTable = ({ assets, editedValues }: { assets: CommodityPriceData[], editedValues: Record<string, number> }) => {
  if (assets.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        Nenhum ativo nesta categoria.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ativo</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
           <TableRow 
            key={asset.id} 
            className={cn(editedValues[asset.id] !== undefined && 'bg-yellow-500/10 hover:bg-yellow-500/20')}
          >
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default function AuditPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { toast } = useToast();

  const [targetDate, setTargetDate] = useState<Date>(() => getValidatedDate(dateParam));
  const [data, setData] = useState<CommodityPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [editingAsset, setEditingAsset] = useState<CommodityPriceData | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const newDate = getValidatedDate(dateParam);
    if (newDate.getTime() !== targetDate.getTime()) {
      setTargetDate(newDate);
      setEditedValues({}); // Reseta edições ao mudar de data
    }
  }, [dateParam, targetDate]);

  useEffect(() => {
    setIsLoading(true);
    getCommodityPricesByDate(targetDate)
      .then((fetchedData) => {
        const dataWithEdits = fetchedData.map(asset => ({
            ...asset,
            price: editedValues[asset.id] ?? asset.price,
        }));
        setData(dataWithEdits);
      })
      .catch((err) => {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar dados',
          description: 'Não foi possível carregar as cotações para a data selecionada.',
        });
        setData([]);
      })
      .finally(() => setIsLoading(false));
  // The 'editedValues' dependency causes re-fetching, which is intended
  // to reflect the local changes in the UI before they are saved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, toast, JSON.stringify(editedValues)]);

  const handleEdit = (asset: CommodityPriceData) => {
    setEditingAsset(asset);
  };
  
  const handleSaveEdit = (assetId: string, newPrice: number) => {
    setEditedValues(prev => ({ ...prev, [assetId]: newPrice }));
    setEditingAsset(null);
    toast({
        title: "Valor Alterado",
        description: `O valor de ${assetId} foi atualizado localmente. Clique em 'Salvar e Recalcular' para persistir.`,
    });
  }

  const handleRecalculate = async () => {
    startTransition(async () => {
        const result = await recalculateAllForDate(targetDate, editedValues);
        if (result.success) {
            toast({
                title: "Sucesso!",
                description: result.message
            });
            setEditedValues({}); // Limpa os valores editados após o sucesso
        } else {
            toast({
                variant: 'destructive',
                title: "Erro no Recálculo",
                description: result.message
            });
        }
    });
  }

  const { currencies, baseCommodities, indices } = useMemo(() => {
    const currencyIds = ['usd', 'eur'];
    const commodityIds = ['milho', 'soja', 'boi_gordo', 'madeira', 'carbono', 'Agua_CRS'];
    
    const dataMap = new Map(data.map(item => [item.id, item.price]));
    const usdPrice = dataMap.get('usd') || 0;
    const eurPrice = dataMap.get('eur') || 0;

    const currencies = data.filter((asset) => currencyIds.includes(asset.id));
    
    const baseCommodities = data
        .filter((asset) => commodityIds.includes(asset.id))
        .map(asset => {
            let rentMediaCalculada: number | undefined;
            switch(asset.id) {
                case 'soja': rentMediaCalculada = Calc.calculateRentMediaSoja(asset.price, usdPrice); break;
                case 'milho': rentMediaCalculada = Calc.calculateRentMediaMilho(asset.price); break;
                case 'boi_gordo': rentMediaCalculada = Calc.calculateRentMediaBoi(asset.price); break;
                case 'madeira': rentMediaCalculada = Calc.calculateRentMediaMadeira(asset.price, usdPrice); break;
                case 'carbono': rentMediaCalculada = Calc.calculateRentMediaCarbono(asset.price, eurPrice); break;
            }
            return { ...asset, rentMediaCalculada };
        });

    const indices = data.filter(
      (asset) => !currencyIds.includes(asset.id) && !commodityIds.includes(asset.id)
    );

    return { currencies, baseCommodities, indices };
  }, [data]);

  const hasEdits = Object.keys(editedValues).length > 0;

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <PageHeader
          title="Auditoria de Dados"
          description="Verifique, corrija e recalcule os dados históricos da plataforma."
          icon={History}
        >
          <div className="flex items-center gap-2">
            {hasEdits && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar e Recalcular
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Recálculo?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você está prestes a sobrescrever os dados para <span className="font-bold">{formatCurrency(targetDate, 'dd/MM/yyyy')}</span> com base nas suas edições. Esta ação não pode ser desfeita. Todos os índices dependentes serão recalculados. Deseja continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRecalculate} disabled={isPending}>
                               {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Sim, Salvar e Recalcular
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <DateNavigator targetDate={targetDate} />
          </div>
        </PageHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Nenhum dado encontrado para esta data.</p>
                </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Moedas e Ativos Base</CardTitle>
                  <CardDescription>Cotações de câmbio e commodities primárias que servem de entrada para os cálculos. <span className="font-semibold text-primary">Estes são os únicos valores editáveis.</span></CardDescription>
                </CardHeader>
                <CardContent>
                  <AssetActionTable assets={currencies} onEdit={handleEdit} editedValues={editedValues} />
                  <AssetActionTable assets={baseCommodities} onEdit={handleEdit} editedValues={editedValues} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Índices Calculados</CardTitle>
                  <CardDescription>Resultados dos índices e sub-índices da plataforma. Estes valores são recalculados automaticamente com base nos ativos base.</CardDescription>
                </CardHeader>
                <CardContent>
                  <IndexTable assets={indices} editedValues={editedValues} />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          isOpen={!!editingAsset}
          onOpenChange={() => setEditingAsset(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}
