
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { CommodityConfig } from '@/lib/types';

const assetSchema = z.object({
  id: z.string().min(2, { message: 'O ID deve ter pelo menos 2 caracteres.' }).regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _'),
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  category: z.enum(['index', 'exchange', 'vus', 'vmad', 'crs']),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  unit: z.string().min(1, { message: 'A unidade é obrigatória.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: AssetFormData) => Promise<void>;
  asset?: CommodityConfig | null;
}

export function AssetFormModal({ isOpen, onOpenChange, onSubmit, asset }: AssetFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!asset;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset ? asset : {
      id: '',
      name: '',
      category: 'vus',
      currency: 'BRL',
      unit: '',
      description: '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset(); // Reseta o formulário ao fechar
    }
    onOpenChange(open);
  };

  const processSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    await onSubmit(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do ativo que será monitorado pela plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Ativo</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="id">ID da Coleção</Label>
              <Input id="id" {...register('id')} disabled={isEditing} placeholder="ex: meu_ativo_novo" />
              {errors.id && <p className="text-sm text-destructive">{errors.id.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="index">Índice</SelectItem>
                                <SelectItem value="exchange">Câmbio</SelectItem>
                                <SelectItem value="vus">VUS (Commodity Agrícola)</SelectItem>
                                <SelectItem value="vmad">VMAD (Madeira)</SelectItem>
                                <SelectItem value="crs">CRS (Sustentabilidade)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="currency">Moeda</Label>
               <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a moeda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BRL">BRL (Real)</SelectItem>
                                <SelectItem value="USD">USD (Dólar Americano)</SelectItem>
                                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
              {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input id="unit" {...register('unit')} placeholder="ex: saca, @, Pontos" />
              {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
            </div>
          </div>
           <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register('description')} placeholder="Descrição curta do ativo..." />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Ativo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
