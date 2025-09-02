
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
import type { CommodityConfig, SearchedAsset } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';


async function searchAssets(query: string): Promise<SearchedAsset[]> {
    if (!query) return [];
    const { searchAssetsFlow } = await import('@/ai/flows/search-assets-flow');
    return searchAssetsFlow({ query });
}


const commoditySchema = z.object({
  id: z.string().min(1, 'O ID (Nome do Ativo) é obrigatório e não pode ser alterado após a criação.').regex(/^[a-zA-Z0-9_ -]+$/, 'ID pode conter apenas letras, números, espaços, _ e -'),
  name: z.string().min(1, 'O Nome de Exibição é obrigatório.'),
  ticker: z.string().min(1, 'Ticker é obrigatório.'),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  category: z.enum(['exchange', 'agriculture', 'forestry', 'carbon']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  unit: z.string().min(1, 'Unidade é obrigatória.'),
  source: z.string().optional(),
  scrapeConfig: z.object({
    url: z.string().url('URL inválida.').or(z.literal('')),
    selector: z.string(),
  }).optional().refine(data => {
    if (data?.url && !data.selector) return false;
    return true;
  }, {
    message: "O seletor CSS é obrigatório se a URL for fornecida.",
    path: ["selector"],
  }),
});


export function EditCommodityModal({ isOpen, onClose, commodity, onSave, isSaving }: EditCommodityModalProps) {
  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = useForm<CommodityConfig>({
    resolver: zodResolver(commoditySchema),
    defaultValues: commodity || {
      id: '',
      name: '',
      ticker: '',
      currency: 'USD',
      category: 'agriculture',
      description: '',
      unit: '',
      source: 'MarketData',
      scrapeConfig: { url: '', selector: '' }
    },
  });
  
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedAsset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);


  useEffect(() => {
    // Reset form when commodity data changes (e.g., opening modal for different items)
    reset(commodity || {
      id: '',
      name: '',
      ticker: '',
      currency: 'USD',
      category: 'agriculture',
      description: '',
      unit: '',
      source: 'MarketData',
      scrapeConfig: { url: '', selector: '' }
    });
  }, [commodity, reset]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
        setSearchResults([]);
        return;
    }
    setIsSearching(true);
    try {
        const results = await searchAssets(query);
        setSearchResults(results);
    } catch (error) {
        console.error("Failed to search assets:", error);
        toast({
            variant: "destructive",
            title: "Erro na Busca",
            description: "Não foi possível buscar os ativos na API.",
        });
    } finally {
        setIsSearching(false);
    }
  }, [toast]);
  
  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, handleSearch]);

  const handleAssetSelect = (asset: SearchedAsset) => {
    setValue('id', asset.description, { shouldValidate: true });
    setValue('name', asset.description, { shouldValidate: true });
    setValue('ticker', asset.symbol, { shouldValidate: true });
    setValue('source', asset.country || 'MarketData');
    setSearchQuery('');
    setSearchResults([]);
  };

  const onSubmit = (data: CommodityConfig) => {
    // When creating, the user-provided ID is used.
    // The name field is used for display.
    const finalData = {
        ...data,
        name: data.name || data.id, // Fallback name to id if empty
    };
    onSave(finalData);
  };
  
  const isCreating = !commodity;
  const source = watch('source');

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

          {isCreating && (
             <div className="relative grid grid-cols-4 items-center gap-4">
                <Label htmlFor="search" className="text-right">
                    Busca de Ativos
                </Label>
                <div className="col-span-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Digite para buscar (ex: 'Soybean', 'Corn')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                    {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((asset) => (
                            <div 
                                key={asset.symbol} 
                                className="p-2 hover:bg-accent cursor-pointer text-sm"
                                onClick={() => handleAssetSelect(asset)}
                            >
                                <p className="font-semibold">{asset.symbol}</p>
                                <p className="text-muted-foreground">{asset.description}</p>
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
          )}


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
            <Label htmlFor="source" className="text-right">Fonte</Label>
            <Input id="source" {...register('source')} className="col-span-3" />
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
