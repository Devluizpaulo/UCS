
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { CommodityPriceData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowRight, DollarSign, Euro } from 'lucide-react';
import { getIconForCategory } from '@/lib/icons';
import { formatCurrency } from '@/lib/formatters';
import { calculateCh2oAgua, calculateCustoAgua, calculatePdm, calculateUcs, calculateUcsAse } from '@/lib/calculation-service';
import { AnimatedNumber } from './ui/animated-number';
import { Separator } from './ui/separator';

interface ScenariosClientProps {
  assets: CommodityPriceData[];
}

export function ScenariosClient({ assets }: ScenariosClientProps) {
  const analyzableAssets = useMemo(() => assets.filter(a => !a.isCalculated && a.id !== 'usd' && a.id !== 'eur'), [assets]);
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>(analyzableAssets[0]?.id || '');
  const [percentageChange, setPercentageChange] = useState(0);

  const [simulatedPrices, setSimulatedPrices] = useState<Record<string, number>>({});
  const [originalPrices, setOriginalPrices] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const prices = assets.reduce((acc, asset) => {
      acc[asset.id] = asset.price;
      return acc;
    }, {} as Record<string, number>);
    setOriginalPrices(prices);
    setSimulatedPrices(prices);
  }, [assets]);
  
  useEffect(() => {
    if (selectedAssetId && originalPrices[selectedAssetId] !== undefined) {
      const originalPrice = originalPrices[selectedAssetId];
      const newPrice = originalPrice * (1 + percentageChange / 100);

      setSimulatedPrices(prev => ({
        ...prev,
        [selectedAssetId]: newPrice
      }));
    }
  }, [selectedAssetId, percentageChange, originalPrices]);
  

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const ucsAseAsset = assets.find(a => a.id === 'ucs_ase');
  const usdRate = assets.find(asset => asset.id === 'usd')?.price || 1;
  const eurRate = assets.find(asset => asset.id === 'eur')?.price || 1;

  const { simulatedUcsAseValue, originalUcsAseValue, impact, impactPercentage } = useMemo(() => {
    if (!ucsAseAsset || Object.keys(originalPrices).length === 0) {
      return { simulatedUcsAseValue: 0, originalUcsAseValue: 0, impact: 0, impactPercentage: 0 };
    }

    const getPriceInBRL = (assetId: string, priceMap: Record<string, number>) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return 0;
        const price = priceMap[assetId];
        if (asset.currency === 'USD') return price * usdRate;
        if (asset.currency === 'EUR') return price * eurRate;
        return price;
    }
    
    const calculateSimulation = (priceMap: Record<string, number>) => {
        const rentMediaValues = {
            boi_gordo: getPriceInBRL('boi_gordo', priceMap) * 0.15,
            milho: getPriceInBRL('milho', priceMap) * 0.15,
            soja: getPriceInBRL('soja', priceMap) * 0.15,
            madeira: getPriceInBRL('madeira', priceMap) * 0.15,
            carbono: getPriceInBRL('carbono', priceMap) * 0.15,
        };
        const ch2oAgua = calculateCh2oAgua(rentMediaValues);
        const custoAgua = calculateCustoAgua(ch2oAgua);
        const pdm = calculatePdm(ch2oAgua, custoAgua);
        const ucs = calculateUcs(pdm);
        return calculateUcsAse(ucs);
    };

    const simulatedValue = calculateSimulation(simulatedPrices);
    const originalValue = ucsAseAsset.price;
    
    const impactValue = simulatedValue - originalValue;
    const impactPercentageValue = originalValue > 0 ? (impactValue / originalValue) * 100 : 0;

    return {
      simulatedUcsAseValue: simulatedValue,
      originalUcsAseValue: originalValue,
      impact: impactValue,
      impactPercentage: impactPercentageValue
    };
  }, [simulatedPrices, originalPrices, assets, ucsAseAsset, usdRate, eurRate]);

  if (!selectedAsset || !ucsAseAsset) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Cenários</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Dados insuficientes para carregar a ferramenta de simulação.</p>
        </CardContent>
      </Card>
    );
  }
  
  const Icon = getIconForCategory(selectedAsset);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulador de Cenários</CardTitle>
        <CardDescription>
          Selecione um ativo e ajuste sua variação de preço para ver o impacto em tempo real no Índice UCS ASE.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        {/* Coluna de Controles */}
        <div className="flex flex-col gap-6">
          <div>
            <Label htmlFor="asset-select" className="mb-2 block">Selecione o Ativo para Simular</Label>
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger id="asset-select">
                <SelectValue placeholder="Selecione um ativo..." />
              </SelectTrigger>
              <SelectContent>
                {analyzableAssets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                        {React.createElement(getIconForCategory(asset), { className: 'h-4 w-4' })}
                        {asset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="percentage-slider">Variação de Preço do Ativo</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="percentage-slider"
                min={-50}
                max={50}
                step={1}
                value={[percentageChange]}
                onValueChange={(value) => setPercentageChange(value[0])}
                className="flex-1"
              />
              <div className="relative w-24">
                <Input
                  type="number"
                  value={percentageChange}
                  onChange={(e) => {
                    const val = Math.max(-50, Math.min(50, Number(e.target.value)));
                    setPercentageChange(val);
                  }}
                  className="pr-6 text-center"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>
          
          <Card className="bg-muted/50">
            <CardHeader className='pb-2'>
                <CardTitle className="text-md flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    Cenário para {selectedAsset.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 items-center gap-4">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Preço Original</p>
                    <p className="font-bold flex items-center justify-center gap-1">
                        {selectedAsset.currency === 'USD' && <DollarSign className="h-4 w-4" />}
                        {selectedAsset.currency === 'EUR' && <Euro className="h-4 w-4" />}
                        {formatCurrency(originalPrices[selectedAssetId] || 0, selectedAsset.currency)}
                    </p>
                </div>
                 <div className="text-center">
                    <p className="text-sm text-muted-foreground">Preço Simulado</p>
                    <p className="font-bold text-primary flex items-center justify-center gap-1">
                        {selectedAsset.currency === 'USD' && <DollarSign className="h-4 w-4" />}
                        {selectedAsset.currency === 'EUR' && <Euro className="h-4 w-4" />}
                        <AnimatedNumber value={simulatedPrices[selectedAssetId] || 0} formatter={(v) => formatCurrency(v, selectedAsset.currency)} />
                    </p>
                </div>
            </CardContent>
          </Card>

        </div>

        {/* Coluna de Resultados */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6">
            <div className="text-center">
                <p className="text-md text-muted-foreground">Valor Original do Índice UCS ASE</p>
                <p className="text-3xl font-bold">
                    {formatCurrency(originalUcsAseValue, 'BRL')}
                </p>
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground my-2" />

            <div className="text-center">
                <p className="text-lg font-semibold">Valor Simulado do Índice UCS ASE</p>
                <p className="text-5xl font-bold text-primary">
                    <AnimatedNumber value={simulatedUcsAseValue} formatter={(v) => formatCurrency(v, 'BRL')} />
                </p>
            </div>
            
            <Separator className="my-4" />

            <div className="text-center">
                <p className="text-md text-muted-foreground">Impacto no Índice</p>
                <p className={`text-2xl font-bold ${impact >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    <AnimatedNumber value={impact} formatter={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v, 'BRL')}`} />
                    <span className="ml-2 text-lg">
                        (<AnimatedNumber value={impactPercentage} formatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} />)
                    </span>
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
