
'use client';

import { useState, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Save, TrendingUp, User, Calendar, TrendingDown, Minus } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { runCompleteSimulation, type SimulationInput, type CalculationResult } from '@/lib/real-calculation-service';
import { cn } from '@/lib/utils';

const editSchema = z.object({
  price: z.preprocess(
    (val) => {
        if(typeof val === 'string') {
            // Permite vírgula e remove pontos de milhar antes de converter
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
  onSave: (assetId: string, newPrice: number) => Promise<void>;
  asset: CommodityPriceData;
  allAssets?: CommodityPriceData[];
  currentUser?: string;
}

export function AssetEditModal({ isOpen, onOpenChange, onSave, asset, allAssets = [], currentUser = 'Sistema' }: AssetEditModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);

  const form: UseFormReturn<EditFormData> = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      price: asset.price,
    },
  });

  const { isSubmitting } = form.formState;

  const handleFormSubmit = (values: EditFormData) => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    const values = form.getValues();
    setIsSaving(true);
    try {
      await onSave(asset.id, values.price);
      setShowConfirmation(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentPriceString = form.watch('price');
  const numericPrice = typeof currentPriceString === 'string'
    ? parseFloat(String(currentPriceString).replace(/\./g, '').replace(',', '.'))
    : Number(currentPriceString);
  
  const hasChanges = numericPrice !== asset.price;
  const currentDate = new Date().toLocaleString('pt-BR');
  
  // Calcular impactos em tempo real
  useEffect(() => {
    if (hasChanges && !isNaN(numericPrice) && numericPrice >= 0) {
      const allCurrentValues: Record<string, number> = {};
      allAssets.forEach(a => {
        allCurrentValues[a.id] = a.price;
      });

      const simulationInput: SimulationInput = {
        usd: allCurrentValues.usd || 0,
        eur: allCurrentValues.eur || 0,
        soja: allCurrentValues.soja || 0,
        milho: allCurrentValues.milho || 0,
        boi_gordo: allCurrentValues.boi_gordo || 0,
        carbono: allCurrentValues.carbono || 0,
        madeira: allCurrentValues.madeira || 0,
        current_vus: allCurrentValues.vus || 0,
        current_vmad: allCurrentValues.vmad || 0,
        current_carbono_crs: allCurrentValues.carbono_crs || 0,
        current_ch2o_agua: allCurrentValues.ch2o_agua || 0,
        current_custo_agua: allCurrentValues.custo_agua || 0,
        current_agua_crs: allCurrentValues.Agua_CRS || 0,
        current_valor_uso_solo: allCurrentValues.valor_uso_solo || 0,
        current_pdm: allCurrentValues.pdm || 0,
        current_ucs: allCurrentValues.ucs || 0,
        current_ucs_ase: allCurrentValues.ucs_ase || 0,
      };

      (simulationInput as any)[asset.id] = numericPrice;

      const results = runCompleteSimulation(simulationInput);
      setCalculationResults(results);
    } else {
      setCalculationResults([]);
    }
  }, [numericPrice, hasChanges, asset.id, allAssets]);

  return (
    <>
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Editar Valor do Ativo
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Alterando o valor para <span className="font-bold">{asset.name}</span>. 
              O valor atual é <span className="font-mono bg-muted px-2 py-1 rounded">{formatCurrency(asset.price, asset.currency, asset.id)}</span>.
          </DialogDescription>
        </DialogHeader>
          
          <DialogBody>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Usuário: <span className="font-medium text-foreground">{currentUser}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Data: <span className="font-medium text-foreground">{currentDate}</span></span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded">
                      <span className="text-xs font-mono text-blue-800">DB</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Formato do Banco de Dados</p>
                      <p className="text-blue-700 mt-1">
                        Valor atual no banco: <code className="bg-blue-100 px-1 rounded font-mono">{asset.price}</code> (formato decimal com ponto)
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        O sistema converte automaticamente entre vírgula (exibição) e ponto (armazenamento)
                      </p>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4" id="asset-edit-form">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Novo Valor</FormLabel>
                          <FormControl>
                            <Input 
                                placeholder="Insira o novo valor (ex: 22,33)" 
                                value={typeof field.value === 'number' ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : String(field.value || '')}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="text-lg h-12 font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-muted-foreground mt-1">
                            💡 Use vírgula para decimais (ex: 22,33) ou ponto (ex: 22.33) - ambos funcionam
                          </div>
                          {hasChanges && (
                            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Alteração detectada: {formatCurrency(asset.price, asset.currency, asset.id)} → {formatCurrency(numericPrice, asset.currency, asset.id)}</span>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                
                {hasChanges && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Análise de Impacto</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {calculationResults.length} ativo(s) serão recalculados
                      </Badge>
                    </div>

                    <div className="bg-green-100 border border-green-300 p-3 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium">📊 Mudança Detectada</p>
                          <p className="mt-1">
                            <strong>{asset.name}:</strong> {formatCurrency(asset.price, asset.currency, asset.id)} → {formatCurrency(numericPrice, asset.currency, asset.id)}
                            {' '}({((numericPrice - asset.price) / asset.price * 100).toFixed(4)}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-100 border border-blue-300 p-3 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">⚠️ Cálculos em Tempo Real</p>
                          <p className="mt-1">
                            Os valores são calculados usando as fórmulas exatas do N8N. 
                            Esta prévia mostra os cálculos que serão aplicados ao salvar.
                          </p>
                        </div>
                      </div>
                    </div>

                    {calculationResults.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {calculationResults.map((result, index) => {
                          const percentChange = result.currentValue > 0 
                            ? ((result.newValue - result.currentValue) / result.currentValue) * 100 
                            : (result.newValue > 0 ? 100 : 0);

                          return (
                            <div key={result.id}>
                              {index > 0 && <Separator className="my-2" />}
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{result.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      Calculado
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>
                                      Atual: {formatCurrency(result.currentValue, 'BRL', result.id)}
                                    </span>
                                    <span>→</span>
                                    <span className="text-green-600 font-medium">
                                      Novo: {formatCurrency(result.newValue, 'BRL', result.id)}
                                    </span>
                                    <span className={`font-medium ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.currentValue === 0 && result.newValue > 0 
                                        ? 'Novo' 
                                        : `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
                                      }
                                    </span>
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    {result.formula}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-blue-500" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm">Calculando impactos...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
          </DialogBody>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
            <Button 
              type="submit" 
              form="asset-edit-form" 
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {hasChanges ? 'Revisar Alteração' : 'Nenhuma Alteração'}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="w-[95vw] max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Alteração
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar o valor do ativo <span className="font-bold">{asset.name}</span>. Verifique os impactos antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Coluna Esquerda: Resumo e Auditoria */}
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Anterior:</span>
                  <span className="font-mono font-medium">{formatCurrency(asset.price, asset.currency, asset.id)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Novo Valor:</span>
                  <span className="font-mono font-medium text-green-600">{formatCurrency(numericPrice, asset.currency, asset.id)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Registro de Auditoria</p>
                    <p className="text-blue-700 mt-1">
                      Esta alteração será registrada com o usuário ({currentUser}) e o carimbo de data e hora ({currentDate}), garantindo a rastreabilidade e a auditoria completa do sistema.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Esta ação irá aplicar os cálculos mostrados ao lado e recalcular automaticamente todos os índices dependentes. Deseja continuar?
              </p>
            </div>

            {/* Coluna Direita: Detalhes do Impacto */}
            <div className="bg-green-50/50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ativos Impactados pelo Recálculo ({calculationResults.length})
              </h4>
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="text-right">Valor Anterior</TableHead>
                      <TableHead className="text-right">Novo Valor</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculationResults.length > 0 ? (
                      calculationResults.map((result) => {
                        const percentChange = result.currentValue > 0 
                          ? ((result.newValue - result.currentValue) / result.currentValue) * 100 
                          : (result.newValue > 0 ? 100 : 0);
                        const isZeroChange = Math.abs(percentChange) < 0.001;

                        return (
                          <TableRow key={result.id}>
                            <TableCell className="py-2 font-medium text-sm text-gray-800">{result.name}</TableCell>
                            <TableCell className="py-2 text-right font-mono text-sm text-muted-foreground">{formatCurrency(result.currentValue, 'BRL', result.id)}</TableCell>
                            <TableCell className="py-2 text-right font-mono text-sm">{formatCurrency(result.newValue, 'BRL', result.id)}</TableCell>
                            <TableCell className={cn(
                              "py-2 text-right font-mono text-xs font-semibold",
                              isZeroChange ? "text-gray-500" : (percentChange > 0 ? "text-green-600" : "text-red-600")
                            )}>
                              <div className="flex items-center justify-end gap-1">
                                {isZeroChange ? <Minus className="h-3 w-3" /> : (percentChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                                ({isZeroChange ? "0.00%" : `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`})
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Calculando impacto...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0 mt-6">
            <AlertDialogCancel disabled={isSaving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSave}
              disabled={isSaving || (calculationResults.length === 0 && hasChanges)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar e Salvar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
