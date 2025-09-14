'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrencyConversion, currencyUtils } from '@/hooks/use-currency-conversion';
import { useToast } from '@/hooks/use-toast';
import type { CommodityPriceData, ConvertedPrice } from '@/lib/types';


type CommodityWithConversion = CommodityPriceData & { convertedPrice?: ConvertedPrice };

export function CurrencyConversionTable() {
  const [commodities, setCommodities] = useState<CommodityWithConversion[]>([]);
  const [targetCurrency, setTargetCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');
  const { toast } = useToast();
  
  const { 
    loading, 
    exchangeRates, 
    error,
    convertAllPrices,
    refreshRates,
  } = useCurrencyConversion();

  const loadData = async (currency: 'BRL' | 'USD' | 'EUR') => {
    const convertedPrices = await convertAllPrices(currency);
    setCommodities(convertedPrices);
  };
  
  const handleRefresh = async () => {
    await refreshRates();
    await loadData(targetCurrency);
    toast({
      title: "Atualizado",
      description: "Dados de conversão atualizados com sucesso"
    });
  };

  const handleCurrencyChange = async (currency: 'BRL' | 'USD' | 'EUR') => {
    setTargetCurrency(currency);
    await loadData(currency);
  };

  useEffect(() => {
    loadData(targetCurrency);
  }, []); // Only on initial load
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);


  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'exchange': 'Câmbio',
      'vus': 'VUS (Pecuária/Grãos)',
      'vmad': 'VMAD (Madeira)',
      'crs': 'CRS (Carbono)'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'exchange': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      'vus': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      'vmad': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      'crs': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Seção de Taxas de Câmbio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Taxas de Câmbio Atuais</CardTitle>
              <CardDescription>
                Taxas utilizadas para conversão de moedas no sistema
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exchangeRates.filter(r => r.to === 'BRL').map((rate, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{rate.from}/{rate.to}</span>
                  <span className="text-lg font-bold text-primary">
                    {rate.rate.toFixed(4)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Atualizado: {rate.lastUpdated ? new Date(rate.lastUpdated).toLocaleString('pt-BR') : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Conversão de Preços */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preços Convertidos por Moeda</CardTitle>
              <CardDescription>
                Visualize todos os preços convertidos para uma moeda específica
              </CardDescription>
            </div>
            <Select value={targetCurrency} onValueChange={handleCurrencyChange} disabled={loading}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && commodities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Carregando conversões...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Original</TableHead>
                    <TableHead>Preço Convertido</TableHead>
                    <TableHead>Taxa de Câmbio</TableHead>
                    <TableHead>Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commodities.map((commodity) => (
                    <TableRow key={commodity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{commodity.name}</div>
                          <div className="text-sm text-muted-foreground">{commodity.ticker}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(commodity.category)}>
                          {getCategoryLabel(commodity.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {currencyUtils.format(commodity.price, commodity.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">{commodity.unit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {commodity.convertedPrice ? (
                          <div>
                            <div className="font-medium">
                              {currencyUtils.format(commodity.convertedPrice.convertedPrice, targetCurrency)}
                            </div>
                            {commodity.convertedPrice.originalCurrency !== targetCurrency && (
                              <div className="text-sm text-muted-foreground">
                                Taxa: {commodity.convertedPrice.exchangeRate.toFixed(4)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {commodity.convertedPrice && commodity.convertedPrice.originalCurrency !== targetCurrency ? (
                          <span className="font-mono">
                            {commodity.convertedPrice.exchangeRate.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">1.0000</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {commodity.change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : commodity.change < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          ) : null}
                          <span className={`font-medium ${
                            commodity.change > 0 ? 'text-green-600' : 
                            commodity.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {commodity.change > 0 ? '+' : ''}{commodity.change.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Exemplo de Implementação */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar o Hook de Conversão</CardTitle>
          <CardDescription>
            Exemplo de código para aplicar a lógica de conversão em outros componentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Em um componente React
import { useCurrencyConversion, currencyUtils } from '@/hooks/use-currency-conversion';

function PriceDisplay({ price, currency }) {
  const { convertSinglePrice, loading } = useCurrencyConversion();
  const [converted, setConverted] = useState(null);

  useEffect(() => {
    convertSinglePrice(price, currency, 'BRL').then(setConverted);
  }, [price, currency]);

  if (loading) return <p>Convertendo...</p>;

  return (
    <div>
      <p>Original: {currencyUtils.format(price, currency)}</p>
      {converted && <p>Em BRL: {currencyUtils.format(converted.convertedPrice, 'BRL')}</p>}
    </div>
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
