
'use client';

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

interface EditCommodityModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodity: CommodityConfig;
  onSave: (data: CommodityConfig) => void;
  isSaving: boolean;
}

const commoditySchema = z.object({
  name: z.string(),
  ticker: z.string().min(1, 'Ticker é obrigatório.'),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  category: z.enum(['exchange', 'agriculture', 'forestry', 'carbon']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  unit: z.string().min(1, 'Unidade é obrigatória.'),
  scrapeConfig: z.object({
    url: z.string().url('URL inválida.').or(z.literal('')),
    selector: z.string(),
  }).optional().refine(data => {
    // If URL is provided, selector must also be provided.
    if (data?.url && !data.selector) {
      return false;
    }
    return true;
  }, {
    message: "O seletor CSS é obrigatório se a URL for fornecida.",
    path: ["selector"],
  }),
});


export function EditCommodityModal({ isOpen, onClose, commodity, onSave, isSaving }: EditCommodityModalProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CommodityConfig>({
    resolver: zodResolver(commoditySchema),
    defaultValues: commodity,
  });

  const onSubmit = (data: CommodityConfig) => {
    onSave(data);
    onClose(); // Ideally, close should only happen on successful save
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Ativo: {commodity.name}</DialogTitle>
          <DialogDescription>
            Ajuste os parâmetros de busca de dados para este ativo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
            <Label htmlFor="category" className="text-right">Categoria</Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="exchange">Câmbio</SelectItem>
                             <SelectItem value="agriculture">Agricultura</SelectItem>
                             <SelectItem value="forestry">Florestal</SelectItem>
                             <SelectItem value="carbon">Carbono</SelectItem>
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
            <Label htmlFor="scrapeConfig.url" className="text-right">URL de Scraping</Label>
            <Input id="scrapeConfig.url" {...register('scrapeConfig.url')} className="col-span-3" placeholder="Deixe em branco para desativar"/>
             {errors.scrapeConfig?.url && <p className="col-span-4 text-xs text-destructive text-right">{errors.scrapeConfig.url.message}</p>}
          </div>
          
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scrapeConfig.selector" className="text-right">Seletor CSS</Label>
            <Input id="scrapeConfig.selector" {...register('scrapeConfig.selector')} className="col-span-3" />
             {errors.scrapeConfig?.selector && <p className="col-span-4 text-xs text-destructive text-right">{errors.scrapeConfig.selector.message}</p>}
          </div>


          <DialogFooter>
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
