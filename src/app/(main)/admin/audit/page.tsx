
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, PlayCircle, Loader2 } from 'lucide-react';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';
import { isValid, parseISO } from 'date-fns';
import { DateNavigator } from '@/components/date-navigator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

function getValidatedDate(dateString?: string | null): Date {
  if (dateString) {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

const AssetActionTable = ({ assets }: { assets: CommodityPriceData[] }) => {
  const { toast } = useToast();

  const handleTestAction = (assetName: string) => {
    toast({
      title: 'Ação de Teste Disparada',
      description: `Botão para o ativo "${assetName}" foi clicado.`,
    });
  };

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
          <TableHead className="text-center w-[150px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(asset.price, asset.currency, asset.id)}
            </TableCell>
            <TableCell className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestAction(asset.name)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Só pra testar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const IndexTable = ({ assets }: { assets: CommodityPriceData[] }) => {
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
          <TableRow key={asset.id}>
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

  useEffect(() => {
    setTargetDate(getValidatedDate(dateParam));
  }, [dateParam]);

  useEffect(() => {
    setIsLoading(true);
    getCommodityPricesByDate(targetDate)
      .then(setData)
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
  }, [targetDate, toast]);

  const { currencies, baseCommodities, indices } = useMemo(() => {
    const currencyIds = ['usd', 'eur'];
    const commodityIds = ['milho', 'soja', 'boi_gordo', 'madeira', 'carbono'];

    const currencies = data.filter((asset) => currencyIds.includes(asset.id));
    const baseCommodities = data.filter((asset) => commodityIds.includes(asset.id));
    const indices = data.filter(
      (asset) => !currencyIds.includes(asset.id) && !commodityIds.includes(asset.id)
    );

    return { currencies, baseCommodities, indices };
  }, [data]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <PageHeader
        title="Auditoria de Dados"
        description="Verifique os dados históricos da plataforma para a data selecionada."
        icon={History}
      >
        <DateNavigator targetDate={targetDate} />
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
                <CardTitle>Moedas</CardTitle>
                <CardDescription>Cotações de câmbio usadas nos cálculos.</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetActionTable assets={currencies} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commodities Base</CardTitle>
                <CardDescription>Valores de mercado das commodities primárias.</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetActionTable assets={baseCommodities} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Índices Calculados</CardTitle>
                <CardDescription>Resultados dos índices e sub-índices da plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <IndexTable assets={indices} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
