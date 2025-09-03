

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CommodityConfig } from '@/lib/types';
import { Loader2 } from 'lucide-react';


const commoditySchema = z.object({
  id: z.string().min(1, 'O ID (Nome do Ativo) é obrigatório e não pode ser alterado após a criação.').regex(/^[a-zA-Z0-9_ -]+$/, 'ID pode conter apenas letras, números, espaços, _ e -'),
  name: z.string().min(1, 'O Nome de Exibição é obrigatório.'),
  ticker: z.string().min(1, 'Ticker é obrigatório.'),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  category: z.enum(['exchange', 'vus', 'vmad', 'crs']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  unit: z.string().min(1, 'Unidade é obrigatória.'),
  source: z.enum(['MarketData']).default('MarketData'),
});


export function EditCommodityModal({ isOpen, onClose, commodity, onSave, isSaving }: EditCommodityModalProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<CommodityConfig>({
    resolver: zodResolver(commoditySchema),
    defaultValues: commodity || {
      id: '',
      name: '',
      ticker: '',
      currency: 'USD',
      category: 'vus',
      description: '',
      unit: '',
      source: 'MarketData',
    },
  });
  
  useEffect(() => {
    // Reset form when commodity data changes (e.g., opening modal for different items)
    reset(commodity || {
      id: '',
      name: '',
      ticker: '',
      currency: 'USD',
      category: 'vus',
      description: '',
      unit: '',
      source: 'MarketData',
    });
  }, [commodity, reset]);


  const onSubmit = (data: CommodityConfig) => {
    const finalData = {
        ...data,
        name: data.name || data.id,
    };
    onSave(finalData);
  };
  
  const isCreating = !commodity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Adicionar Novo Ativo' : `Editar Ativo: ${commodity?.name}`}</DialogTitle>
          <DialogDescription>
            Ajuste os parâmetros de busca de dados para este ativo. O ID do Ativo é único e não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">ID do Ativo</Label>
            <Input id="id" {...register('id')} className="col-span-3" disabled={!isCreating} placeholder="Ex: Soja Futuros"/>
            {errors.id && <p className="col-span-4 text-xs text-destructive text-right">{errors.id.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome de Exibição</Label>
            <Input id="name" {...register('name')} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-xs text-destructive text-right">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ticker" className="text-right">Ticker</Label>
            <Input id="ticker" {...register('ticker')} className="col-span-3" />
            {errors.ticker && <p className="col-span-4 text-xs text-destructive text-right">{errors.ticker.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">Moeda</Label>
            <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a Moeda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BRL">BRL</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Componente do Índice</Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o Componente" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="exchange">Câmbio (Moedas)</SelectItem>
                             <SelectItem value="vus">Uso do Solo (VUS)</SelectItem>
                             <SelectItem value="vmad">Madeira (VMAD)</SelectItem>
                             <SelectItem value="crs">Socioambiental (CRS)</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
          </div>
          
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">Unidade</Label>
            <Input id="unit" {...register('unit')} className="col-span-3" />
             {errors.unit && <p className="col-span-4 text-xs text-destructive text-right">{errors.unit.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" {...register('description')} className="col-span-3" />
             {errors.description && <p className="col-span-4 text-xs text-destructive text-right">{errors.description.message}</p>}
          </div>
          
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source" className="text-right">Fonte</Label>
             <Controller
                name="source"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a Fonte" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="MarketData">MarketData API</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
             {errors.source && <p className="col-span-4 text-xs text-destructive text-right">{errors.source.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditCommodityModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodity: CommodityConfig | null; // Can be null for creating a new one
  onSave: (data: CommodityConfig) => void;
  isSaving: boolean;
}
