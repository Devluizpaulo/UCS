'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { calculateAffectedAssets, getAssetDependencyInfo, ASSET_DEPENDENCIES } from '@/lib/dependency-service';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';
import { runCompleteSimulation, type SimulationInput, type CalculationResult } from '@/lib/real-calculation-service';

interface ImpactPreviewProps {
  editedAsset: CommodityPriceData;
  newValue: number;
  allAssets: CommodityPriceData[];
}

interface ImpactedAsset {
  id: string;
  name: string;
  currentValue: number;
  estimatedNewValue: number;
  percentageChange: number;
  currency: string;
  type: 'base' | 'calculated' | 'index' | 'sub-index';
}

// Funções de cálculo simplificadas (baseadas no fluxo N8N)
function calculateRentMediaSoja(sojaPrice: number, usdRate: number): number {
  return (sojaPrice / 60 * 1000) * usdRate * 3.3;
}

function calculateRentMediaBoi(boiPrice: number): number {
  return boiPrice * 18;
}

function calculateRentMediaMilho(milhoPrice: number): number {
  return (milhoPrice / 60 * 1000) * 7.20;
}

function calculateRentMediaCarbono(carbonoPrice: number, eurRate: number): number {
  return carbonoPrice * eurRate * 2.59;
}

function calculateRentMediaMadeira(madeiraPrice: number, usdRate: number): number {
  return madeiraPrice * usdRate * 1196.54547720813 * 0.10;
}

function calculateVUS(rentMediaBoi: number, rentMediaMilho: number, rentMediaSoja: number): number {
  return ((rentMediaBoi * 25 * 0.35) + (rentMediaMilho * 25 * 0.30) + (rentMediaSoja * 25 * 0.35)) * (1 - 0.048);
}

function calculateVMAD(rentMediaMadeira: number): number {
  return rentMediaMadeira * 5;
}

function calculateCarbonooCRS(rentMediaCarbono: number): number {
  return rentMediaCarbono * 25;
}

function calculateCH2OAgua(rentMediaBoi: number, rentMediaMilho: number, rentMediaSoja: number, rentMediaMadeira: number, rentMediaCarbono: number): number {
  return (rentMediaBoi * 0.35) + (rentMediaMilho * 0.30) + (rentMediaSoja * 0.35) + rentMediaMadeira + rentMediaCarbono;
}

function calculateValorUsoSolo(vus: number, vmad: number, carbonoCrs: number, aguaCrs: number): number {
  return vus + vmad + carbonoCrs + aguaCrs;
}

function calculatePDM(ch2oAgua: number, custoAgua: number): number {
  return ch2oAgua + custoAgua;
}

function calculateUCS(pdm: number): number {
  return (pdm / 900) / 2;
}

function calculateUCSASE(ucs: number): number {
  return ucs * 2;
}

export function ImpactPreview({ editedAsset, newValue, allAssets }: ImpactPreviewProps) {
  const simulationResults = useMemo(() => {
    // Busca valores atuais dos ativos nos dados carregados
    const getAssetValue = (id: string) => {
      const asset = allAssets.find(a => a.id === id);
      return asset?.price || 0;
    };
    
    // Prepara input para simulação com valores atuais e originais
    const currentValues: SimulationInput = {
      usd: getAssetValue('usd'),
      eur: getAssetValue('eur'),
      soja: getAssetValue('soja'),
      milho: getAssetValue('milho'),
      boi_gordo: getAssetValue('boi_gordo'),
      carbono: getAssetValue('carbono'),
      madeira: getAssetValue('madeira'),
      current_vus: getAssetValue('vus'),
      current_vmad: getAssetValue('vmad'),
      current_carbono_crs: getAssetValue('carbono_crs'),
      current_ch2o_agua: getAssetValue('ch2o_agua'),
      current_custo_agua: getAssetValue('custo_agua'),
      current_valor_uso_solo: getAssetValue('valor_uso_solo'),
      current_pdm: getAssetValue('pdm'),
      current_ucs: getAssetValue('ucs'),
      current_ucs_ase: getAssetValue('ucs_ase'),
    };
    
    // Aplica a edição ao input, mantendo valores originais para comparação
    const editedValues = { 
      ...currentValues,
      // Valores originais para cálculo de variação
      original_usd: getAssetValue('usd'),
      original_eur: getAssetValue('eur'),
      original_soja: getAssetValue('soja'),
      original_milho: getAssetValue('milho'),
      original_boi_gordo: getAssetValue('boi_gordo'),
      original_carbono: getAssetValue('carbono'),
      original_madeira: getAssetValue('madeira'),
    };
    
    // Aplica a edição específica
    (editedValues as any)[editedAsset.id] = newValue;
    
    // Executa simulação com valores editados
    const results = runCompleteSimulation(editedValues);
    
    // Filtra apenas os resultados que foram realmente afetados
    const affectedResults = results.filter(result => {
      const percentageChange = result.currentValue !== 0 
        ? ((result.newValue - result.currentValue) / result.currentValue) * 100 
        : 0;
      return Math.abs(percentageChange) > 0.001; // Só mostra se mudança > 0.001%
    });
    
    return affectedResults.map(result => ({
      id: result.id,
      name: result.name,
      currentValue: result.currentValue,
      estimatedNewValue: result.newValue,
      percentageChange: result.currentValue !== 0 
        ? ((result.newValue - result.currentValue) / result.currentValue) * 100 
        : 0,
      currency: 'BRL',
      type: ASSET_DEPENDENCIES[result.id]?.calculationType || 'calculated',
      formula: result.formula,
      components: result.components,
      conversions: result.conversions
    }));
  }, [editedAsset, newValue, allAssets]);
  
  const { asset: assetInfo } = getAssetDependencyInfo(editedAsset.id);
  
  if (simulationResults.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Análise de Impacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este ativo não possui dependências calculadas automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Estimativa de Impacto
        </CardTitle>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {simulationResults.length} ativo(s) serão recalculados automaticamente
          </p>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">📊 Estimativa Proporcional</p>
                <p className="mt-1">
                  Os valores são estimados baseados em impactos proporcionais conhecidos. 
                  Para cálculos exatos, use o N8N ou execute a atualização direta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {simulationResults.map((impact, index) => {
          const isDirectlyDependent = ASSET_DEPENDENCIES[impact.id]?.dependsOn.includes(editedAsset.id);
          
          return (
            <div key={impact.id}>
              {index > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{impact.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {impact.type === 'index' ? 'Índice' : 
                       impact.type === 'sub-index' ? 'Sub-índice' : 
                       impact.type === 'calculated' ? 'Calculado' : 'Base'}
                    </Badge>
                    {isDirectlyDependent && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        Dependência Direta
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Atual: {formatCurrency(impact.currentValue, impact.currency, impact.id)}
                    </span>
                    <span>→</span>
                    <span className="font-medium text-foreground">
                      Novo: {formatCurrency(impact.estimatedNewValue, impact.currency, impact.id)}
                    </span>
                  </div>
                  {impact.formula && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📐 {impact.formula}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {Math.abs(impact.percentageChange) < 0.01 ? (
                    <Minus className="h-4 w-4 text-gray-400" />
                  ) : impact.percentageChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    Math.abs(impact.percentageChange) < 0.01 ? 'text-gray-500' :
                    impact.percentageChange > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(impact.percentageChange) < 0.01 ? '~0%' : 
                     `${impact.percentageChange > 0 ? '+' : ''}${impact.percentageChange.toFixed(2)}%`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {assetInfo?.formula && (
          <>
            <Separator className="my-3" />
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fórmula Base:</p>
              <code className="text-xs bg-background px-2 py-1 rounded border">
                {assetInfo.formula}
              </code>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
