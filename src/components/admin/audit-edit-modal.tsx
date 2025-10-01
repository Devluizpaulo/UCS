
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { AssetItem } from '@/app/(main)/admin/audit/page';
import { formatCurrency } from '@/lib/formatters';
import * as Calc from '@/lib/calculation-service';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { getAssetCompositionConfig } from '@/lib/calculation-service';
import { Separator } from '../ui/separator';

interface AuditEditModalProps {
  assetItem: AssetItem | null;
  allAssets: AssetItem[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (assetId: string, newValue: number) => void;
}

interface ImpactedAsset {
  id: string;
  name: string;
  currency: string;
  oldValue: number;
  newValue: number;
}

export function AuditEditModal({ assetItem, allAssets, isOpen, onOpenChange, onSave }: AuditEditModalProps) {
  const [newValue, setNewValue] = useState('');
  const [impactedAssets, setImpactedAssets] = useState<ImpactedAsset[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (assetItem?.quote) {
      const currentValue = assetItem.quote.valor ?? assetItem.quote.ultimo ?? (assetItem.quote as any)?.valor_brl ?? '';
      setNewValue(String(currentValue));
      setImpactedAssets([]); // Reset on new asset
    } else {
        setNewValue('');
    }
  }, [assetItem]);

 const calculateImpact = (changedAssetId: string, newAssetValue: number) => {
    setIsCalculating(true);

    const oldValues: Calc.ValueMap = {};
    allAssets.forEach(a => {
        oldValues[a.id] = a.quote?.valor ?? a.quote?.ultimo ?? (a.quote as any)?.valor_brl ?? 0;
    });

    const newValues: Calc.ValueMap = { ...oldValues };
    newValues[changedAssetId] = newAssetValue;

    // Etapa 1: Calcular as rentabilidades médias com os novos valores
    const rentMedia: Calc.ValueMap = {};
    rentMedia.boi_gordo = Calc.calculateRentMediaBoi(newValues.boi_gordo);
    rentMedia.milho = Calc.calculateRentMediaMilho(newValues.milho);
    rentMedia.soja = Calc.calculateRentMediaSoja(newValues.soja, newValues.usd);
    rentMedia.carbono = Calc.calculateRentMediaCarbono(newValues.carbono, newValues.eur);
    rentMedia.madeira = Calc.calculateRentMediaMadeira(newValues.madeira, newValues.usd);

    // Etapa 2: Recalcular os índices baseados nas rentabilidades
    newValues.vus = Calc.calculateVUS(rentMedia);
    newValues.vmad = Calc.calculateVMAD(rentMedia);
    newValues.carbono_crs = Calc.calculateCRS(rentMedia);
    
    // Etapa 3: Recalcular os índices subsequentes em cascata
    newValues.valor_uso_solo = Calc.calculateValorUsoSolo({
        vus: newValues.vus,
        vmad: newValues.vmad,
        carbono_crs: newValues.carbono_crs,
        Agua_CRS: newValues.Agua_CRS,
    });
    newValues.pdm = Calc.calculatePDM({ valor_uso_solo: newValues.valor_uso_solo });
    newValues.ucs = Calc.calculateUCS({ pdm: newValues.pdm });
    newValues.ucs_ase = Calc.calculateUCSASE({ ucs: newValues.ucs });

    const impacted: ImpactedAsset[] = [];
    for (const id in newValues) {
        if (newValues[id] !== oldValues[id] && id !== changedAssetId) {
            const assetConfig = allAssets.find(a => a.id === id);
            if (assetConfig && oldValues[id] !== undefined) {
                 // Check for significant change to avoid floating point noise
                if (Math.abs(newValues[id] - oldValues[id]) > 1e-9) {
                    impacted.push({
                        id,
                        name: assetConfig.name,
                        currency: assetConfig.currency,
                        oldValue: oldValues[id],
                        newValue: newValues[id],
                    });
                }
            }
        }
    }
    
    // Sort impacted assets to show main indices first
    const order = ['ucs_ase', 'ucs', 'pdm', 'valor_uso_solo'];
    impacted.sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
    });

    setImpactedAssets(impacted);
    setIsCalculating(false);
};

  
  useEffect(() => {
    if (!assetItem) return;
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      const timer = setTimeout(() => {
        calculateImpact(assetItem.id, numericValue);
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newValue, assetItem]);


  if (!assetItem) return null;

  const handleSave = () => {
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      onSave(assetItem.id, numericValue);
      onOpenChange(false);
    }
  };

  const principalValue = assetItem.quote?.valor ?? assetItem.quote?.ultimo ?? (assetItem.quote as any)?.valor_brl;
  const numericNewValue = parseFloat(newValue.replace(',', '.'));
  const hasValidChange = !isNaN(numericNewValue) && numericNewValue !== principalValue;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Editar Valor de Cotação</DialogTitle>
          <DialogDescription>
            Alterando o valor para <span className="font-bold">{assetItem.name}</span>. Essa ação será aplicada após clicar em "Salvar e Recalcular".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-value" className="text-right">
                Valor Atual
              </Label>
              <Input
                id="current-value"
                value={typeof principalValue === 'number' ? formatCurrency(principalValue, assetItem.currency, assetItem.id) : 'N/A'}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-value" className="text-right">
                Novo Valor
              </Label>
              <Input
                id="new-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="col-span-3"
                type="text"
                inputMode="decimal"
                placeholder="Digite o novo valor"
                autoFocus
              />
            </div>

            {hasValidChange && (
              <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Impacto do Recálculo
                </h4>
                {isCalculating ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : impactedAssets.length > 0 ? (
                  <div className="space-y-2 rounded-md border p-4 bg-muted/50 max-h-48 overflow-y-auto">
                    {impactedAssets.map(impact => (
                      <div key={impact.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{impact.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-muted-foreground line-through">{formatCurrency(impact.oldValue, impact.currency, impact.id)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-primary">{formatCurrency(impact.newValue, impact.currency, impact.id)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">Nenhum outro ativo foi impactado diretamente por essa mudança.</p>
                )}
              </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!hasValidChange}>Salvar Alteração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
