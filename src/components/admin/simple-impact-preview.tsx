
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { calculateAffectedAssets, getAssetDependency, ASSET_DEPENDENCIES } from '@/lib/dependency-service';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';

interface SimpleImpactPreviewProps {
  editedAsset: CommodityPriceData;
  newValue: number;
  allAssets: CommodityPriceData[];
}

export function SimpleImpactPreview({ editedAsset, newValue, allAssets }: SimpleImpactPreviewProps) {
  const impactInfo = useMemo(() => {
    const affectedIds = calculateAffectedAssets([editedAsset.id]);
    const currentValue = editedAsset.price;
    const valueChange = currentValue > 0 ? ((newValue - currentValue) / currentValue) * 100 : (newValue > 0 ? 100 : 0);
    
    const affectedAssets = affectedIds.map(assetId => {
      const assetDep = ASSET_DEPENDENCIES[assetId];
      const currentAssetValue = allAssets.find(a => a.id === assetId)?.price || 0;
      const isDirectlyDependent = assetDep?.dependsOn.includes(editedAsset.id);
      
      return {
        id: assetId,
        name: assetDep?.name || assetId,
        currentValue: currentAssetValue,
        type: assetDep?.calculationType || 'calculated',
        isDirectlyDependent,
        formula: assetDep?.formula
      };
    });
    
    return {
      valueChange,
      affectedAssets: affectedAssets.sort((a, b) => {
        // Prioriza dependências diretas
        if (a.isDirectlyDependent && !b.isDirectlyDependent) return -1;
        if (!a.isDirectlyDependent && b.isDirectlyDependent) return 1;
        return a.name.localeCompare(b.name);
      })
    };
  }, [editedAsset, newValue, allAssets]);
  
  const assetInfo = getAssetDependency(editedAsset.id);
  
  if (impactInfo.affectedAssets.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
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
          Análise de Impacto
        </CardTitle>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {impactInfo.affectedAssets.length} ativo(s) serão recalculados automaticamente
          </p>
          
          {/* Resumo da mudança */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Mudança Detectada</p>
                <p className="mt-1">
                  {editedAsset.name}: {formatCurrency(editedAsset.price, editedAsset.currency, editedAsset.id)} → {formatCurrency(newValue, editedAsset.currency, editedAsset.id)}
                  <span className={`ml-2 font-medium ${impactInfo.valueChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ({impactInfo.valueChange >= 0 ? '+' : ''}{impactInfo.valueChange.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Aviso sobre cálculos */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">⚠️ Valores Exatos</p>
                <p className="mt-1">
                  Os valores finais serão calculados pelo sistema N8N com fórmulas complexas. 
                  Esta prévia mostra apenas quais ativos serão afetados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {impactInfo.affectedAssets.map((asset, index) => (
          <div key={asset.id}>
            {index > 0 && <Separator className="my-2" />}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{asset.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {asset.type === 'index' || asset.type === 'main-index' ? 'Índice' : 
                     asset.type === 'credit' ? 'Crédito' : 
                     asset.type === 'calculated' ? 'Calculado' : 'Base'}
                  </Badge>
                  {asset.isDirectlyDependent && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      Dependência Direta
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Valor Atual: {formatCurrency(asset.currentValue, 'BRL', asset.id)}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Será recalculado pelo sistema de atualização direta
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">
                  Recálculo
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {assetInfo?.formula && (
          <>
            <Separator className="my-3" />
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fórmula Base do Ativo Editado:</p>
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
