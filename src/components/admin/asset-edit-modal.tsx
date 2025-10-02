
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

const editSchema = z.object({
  price: z.preprocess(
    (val) => {
        if(typeof val === 'string') {
            // Converte o formato '1.234,56' para '1234.56'
            return parseFloat(val.replace(/\./g, '').replace(',', '.'));
        }
        return val;
    },
    z.number({ invalid_type_error: 'O valor deve ser um número.' })
     .min(0, 'O valor não pode ser negativo.')
  ),
});

type EditFormData = z.infer<typeof editSchema>;

interface AssetEditModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (assetId: string, newPrice: number) => void;
  asset: CommodityPriceData;
}

export function AssetEditModal({ isOpen, onOpenChange, onSave, asset }: AssetEditModalProps) {

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      // Formata o valor para o padrão brasileiro para exibição
      price: asset.price,
    },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (values: EditFormData) => {
    onSave(asset.id, values.price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Valor do Ativo</DialogTitle>
          <DialogDescription>
            Alterando o valor para <span className="font-bold">{asset.name}</span>. O valor atual é <span className="font-mono">{formatCurrency(asset.price, asset.currency, asset.id)}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4" id="asset-edit-form">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Valor</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Insira o novo valor" 
                        {...field} 
                        // Formata o valor numérico para uma string localizada ao exibir
                        value={typeof field.value === 'number' ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4}) : ''}
                        onChange={(e) => {
                            // Permite que o usuário digite vírgula
                            const rawValue = e.target.value;
                            field.onChange(rawValue);
                        }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="asset-edit-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
