'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { convertAllPricesToCurrency, getExchangeRates, formatCurrency, clearExchangeRateCache } from '@/lib/currency-service';
import type { CurrencyRate, ConvertedPrice } from '@/lib/currency-service';
import type { CommodityPriceData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type CommodityWithConversion = CommodityPriceData & { convertedPrice?: ConvertedPrice };

export function CurrencyConversionTable() {
  const [commodities, setCommodities] = useState<CommodityWithConversion[]>([]);
  const [exchangeRates, setExchangeRates] = useState<CurrencyRate[]>([]);
  const [targetCurrency, setTargetCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carrega as taxas de câmbio
      const rates = await getExchangeRates();
      setExchangeRates(rates);
      
      // Carrega os preços convertidos
      const convertedPrices = await convertAllPricesToCurrency(targetCurrency);
      setCommodities(convertedPrices);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de conversão de moeda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    clearExchangeRateCache();
    await loadData();
    toast({
      title: "Atualizado",
      description: "Dados de conversão atualizados com sucesso"
    });
  };

  const handleCurrencyChange = async (currency: 'BRL' | 'USD' | 'EUR') => {
    setTargetCurrency(currency);
    setLoading(true);
    
    try {
      const convertedPrices = await convertAllPricesToCurrency(currency);
      setCommodities(convertedPrices);
    } catch (error) {
      console.error('Erro ao converter moeda:', error);
      toast({
        title: "Erro",
        description: "Falha ao converter para a moeda selecionada",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels = {
      'exchange': 'Câmbio',
      'vus': 'VUS (Pecuária/Grãos)',
      'vmad': 'VMAD (Madeira)',
      'crs': 'CRS (Carbono)'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'exchange': 'bg-blue-100 text-blue-800',
      'vus': 'bg-green-100 text-green-800',
      'vmad': 'bg-yellow-100 text-yellow-800',
      'crs': 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
            {exchangeRates.map((rate, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{rate.from}/{rate.to}</span>
                  <span className="text-lg font-bold">
                    {rate.rate.toFixed(4)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Atualizado: {rate.lastUpdated.toLocaleString('pt-BR')}
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
            <Select value={targetCurrency} onValueChange={handleCurrencyChange}>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Carregando conversões...
            </div>
          ) : (
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
                        <div className="text-sm text-gray-500">{commodity.ticker}</div>
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
                          {formatCurrency(commodity.price, commodity.currency)}
                        </div>
                        <div className="text-sm text-gray-500">{commodity.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {commodity.convertedPrice ? (
                        <div>
                          <div className="font-medium">
                            {formatCurrency(commodity.convertedPrice.convertedPrice, targetCurrency)}
                          </div>
                          {commodity.convertedPrice.originalCurrency !== targetCurrency && (
                            <div className="text-sm text-gray-500">
                              Taxa: {commodity.convertedPrice.exchangeRate.toFixed(4)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {commodity.convertedPrice && commodity.convertedPrice.originalCurrency !== targetCurrency ? (
                        <span className="font-mono">
                          {commodity.convertedPrice.exchangeRate.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-gray-400">1.0000</span>
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
          )}
        </CardContent>
      </Card>

      {/* Seção de Exemplo de Implementação */}
      <Card>
        <CardHeader>
          <CardTitle>Como Implementar a Conversão</CardTitle>
          <CardDescription>
            Exemplo de código para aplicar a lógica de conversão de moedas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Exemplo de uso do serviço de conversão
import { convertPrice, convertAllPricesToCurrency, formatCurrency } from '@/lib/currency-service';

// Converter um preço específico
const converted = await convertPrice(100, 'USD', 'BRL');
if (converted) {
  console.log(\`Preço original: \${formatCurrency(converted.originalPrice, 'USD')}\`);
  console.log(\`Preço convertido: \${formatCurrency(converted.convertedPrice, 'BRL')}\`);
  console.log(\`Taxa de câmbio: \${converted.exchangeRate}\`);
}

// Converter todos os preços para BRL
const allPricesInBRL = await convertAllPricesToCurrency('BRL');
allPricesInBRL.forEach(commodity => {
  if (commodity.convertedPrice) {
    console.log(\`\${commodity.name}: \${formatCurrency(commodity.convertedPrice.convertedPrice, 'BRL')}\`);
  }
});`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}