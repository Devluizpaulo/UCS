'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import type { AssetItem } from '@/app/(main)/admin/audit/page';
import { formatCurrency } from '@/lib/formatters';

interface AuditEditModalProps {
  assetItem: AssetItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (assetId: string, newValue: number) => void;
}

export function AuditEditModal({ assetItem, isOpen, onOpenChange, onSave }: AuditEditModalProps) {
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (assetItem?.quote) {
      const currentValue = assetItem.quote.ultimo ?? assetItem.quote.valor ?? '';
      setNewValue(String(currentValue));
    } else {
        setNewValue('');
    }
  }, [assetItem]);

  if (!assetItem) return null;

  const handleSave = () => {
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      onSave(assetItem.id, numericValue);
      onOpenChange(false);
    }
  };

  const principalValue = assetItem.quote?.ultimo ?? assetItem.quote?.valor;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Valor de Cotação</DialogTitle>
          <DialogDescription>
            Alterando o valor para <span className="font-bold">{assetItem.name}</span>. Essa ação irá disparar um recálculo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
            />
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar e Recalcular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
