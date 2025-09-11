'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, TrendingUp } from 'lucide-react';
import { getCommodityPrices } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';

export default function DataSourcePage() {
  const [commodities, setCommodities] = useState<CommodityPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getCommodityPrices();
      setCommodities(data);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fontes de Dados</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento e gerenciamento das fontes de dados do sistema UCS
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {lastUpdate && (
        <div className="mb-6">
          <Badge variant="outline">
            Última atualização: {lastUpdate}
          </Badge>
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Commodities e Preços
            </CardTitle>
            <CardDescription>
              Dados de preços de commodities utilizados no cálculo do índice UCS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {commodities.map((commodity) => (
                <div key={commodity.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{commodity.name}</h3>
                    <p className="text-sm text-muted-foreground">{commodity.description}</p>
                    <Badge variant="secondary" className="mt-1">
                      {commodity.source || 'N/A'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">
                      {commodity.currency} {commodity.price.toFixed(2)}
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${
                      commodity.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {commodity.change >= 0 ? '+' : ''}{commodity.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}