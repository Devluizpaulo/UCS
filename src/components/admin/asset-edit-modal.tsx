'use client';

import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, Save, TrendingUp, User, Calendar } from 'lucide-react';
import type { CommodityPriceData } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { runCompleteSimulation, type SimulationInput, type CalculationResult } from '@/lib/real-calculation-service';
import { calculateAffectedAssets } from '@/lib/dependency-service';

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
  onSave: (assetId: string, newPrice: number) => Promise<void>;
  asset: CommodityPriceData;
  allAssets?: CommodityPriceData[];
  currentUser?: string;
}

export function AssetEditModal({ isOpen, onOpenChange, onSave, asset, allAssets = [], currentUser = 'Sistema' }: AssetEditModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);

  const form = useForm<EditFormData>({
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

  const currentPrice = form.watch('price');
  
  // Função para calcular impactos em tempo real
  const calculateRealTimeImpacts = (newValue: number) => {
    if (!allAssets.length || isNaN(newValue) || newValue < 0) {
      setCalculationResults([]);
      return;
    }

    try {
      // Preparar dados atuais de todos os ativos
      const currentValues: Record<string, number> = {};
      allAssets.forEach(a => {
        currentValues[a.id] = a.price;
      });

      // Preparar input para simulação
      const simulationInput: SimulationInput = {
        usd: currentValues.usd || 0,
        eur: currentValues.eur || 0,
        soja: currentValues.soja || 0,
        milho: currentValues.milho || 0,
        boi_gordo: currentValues.boi_gordo || 0,
        carbono: currentValues.carbono || 0,
        madeira: currentValues.madeira || 0,
        current_vus: currentValues.vus || 0,
        current_vmad: currentValues.vmad || 0,
        current_carbono_crs: currentValues.carbono_crs || 0,
        current_ch2o_agua: currentValues.ch2o_agua || 0,
        current_custo_agua: currentValues.custo_agua || 0,
        current_agua_crs: currentValues.Agua_CRS || 0,
        current_valor_uso_solo: currentValues.valor_uso_solo || 0,
        current_pdm: currentValues.pdm || 0,
        current_ucs: currentValues.ucs || 0,
        current_ucs_ase: currentValues.ucs_ase || 0,
      };

      // Aplicar o novo valor editado
      (simulationInput as any)[asset.id] = newValue;

      // Executar simulação
      const results = runCompleteSimulation(simulationInput);
      setCalculationResults(results);
    } catch (error) {
      console.error('Erro no cálculo em tempo real:', error);
      setCalculationResults([]);
    }
  };
  
  // Função para converter valor brasileiro para número
  const parsePrice = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    // Remove espaços e caracteres especiais, exceto vírgula e ponto
    let cleanValue = value.toString().trim();
    
    // Se tem vírgula e ponto, assume formato brasileiro (1.234,56)
    if (cleanValue.includes(',') && cleanValue.includes('.')) {
      // Remove pontos (separadores de milhares) e troca vírgula por ponto
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    }
    // Se tem apenas vírgula, assume que é decimal brasileiro
    else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
      cleanValue = cleanValue.replace(',', '.');
    }
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  const numericPrice = typeof currentPrice === 'string' ? parsePrice(currentPrice) : currentPrice;
  const hasChanges = numericPrice !== asset.price;
  const affectedAssets = calculateAffectedAssets([asset.id]);
  const currentDate = new Date().toLocaleString('pt-BR');
  
  // Calcular impactos em tempo real quando o valor muda
  useEffect(() => {
    if (hasChanges) {
      calculateRealTimeImpacts(numericPrice);
    } else {
      setCalculationResults([]);
    }
  }, [numericPrice, hasChanges, asset.id, allAssets]);

  return (
    <>
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[900px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Editar Valor do Ativo
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Alterando o valor para <span className="font-bold">{asset.name}</span>. 
              O valor atual é <span className="font-mono bg-muted px-2 py-1 rounded">{formatCurrency(asset.price, asset.currency, asset.id)}</span>.
          </DialogDescription>
        </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Informações do Usuário e Data */}
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

                {/* Informações do Banco de Dados */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-1 rounded">
                      <span className="text-xs font-mono text-blue-800">DB</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Formato do Banco de Dados</p>
                      <p className="text-blue-700 mt-1">
                        Valor atual no banco: <code className="bg-blue-100 px-1 rounded font-mono">{asset.price}</code> 
                        (formato decimal com ponto)
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        O sistema converte automaticamente entre vírgula (exibição) e ponto (armazenamento)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Formulário */}
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
                                value={typeof field.value === 'number' ? field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : field.value || ''}
                        onChange={(e) => {
                            const rawValue = e.target.value;
                            field.onChange(rawValue);
                        }}
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
                
                {/* Análise de Impacto em Tempo Real */}
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
                            Os valores mostrados são calculados usando as fórmulas exatas do N8N. 
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
                            : (result.newValue > 0 ? 100 : 0); // Se era zero e agora tem valor, mostra como +100%

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
            </ScrollArea>
          </div>
          
          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
            <Button 
              type="submit" 
              form="asset-edit-form" 
              disabled={isSubmitting || !hasChanges}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {hasChanges ? 'Revisar Alteração' : 'Nenhuma Alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Modal de Confirmação */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="w-[95vw] max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Alteração
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Você está prestes a alterar o valor do ativo <span className="font-bold">{asset.name}</span>.</p>
                
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Atual:</span>
                    <span className="font-mono font-medium">{formatCurrency(asset.price, asset.currency, asset.id)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Novo Valor:</span>
                    <span className="font-mono font-medium text-green-600">{formatCurrency(numericPrice, asset.currency, asset.id)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Ativos Impactados:</span>
                    <Badge variant="secondary">{calculationResults.length} ativo(s)</Badge>
                  </div>
                </div>

                {/* Resumo dos Cálculos */}
                {calculationResults.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Valores que serão Atualizados
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {calculationResults.slice(0, 5).map((result) => {
                        const percentChange = result.currentValue > 0 
                          ? ((result.newValue - result.currentValue) / result.currentValue) * 100 
                          : (result.newValue > 0 ? 100 : 0);

                        return (
                          <div key={result.id} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-green-800">{result.name}:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-green-700">
                                {formatCurrency(result.newValue, 'BRL', result.id)}
                              </span>
                              <span className={`text-xs font-medium ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({result.currentValue === 0 && result.newValue > 0 
                                  ? 'Novo' 
                                  : `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
                                })
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {calculationResults.length > 5 && (
                        <div className="text-xs text-green-600 text-center pt-2">
                          ... e mais {calculationResults.length - 5} ativo(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Registro de Auditoria</p>
                      <p className="text-blue-700 mt-1">
                        Esta alteração será registrada com seu usuário ({currentUser}) e timestamp ({currentDate}) 
                        para auditoria completa do sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {calculationResults.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Esta ação irá aplicar os cálculos mostrados acima e recalcular automaticamente todos os índices dependentes. Deseja continuar?
                  </p>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Aguardando Cálculos</p>
                        <p className="mt-1">
                          Os cálculos de impacto estão sendo processados. Aguarde para ver os valores que serão atualizados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isSaving} className="flex-1 sm:flex-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSave}
              disabled={isSaving || (calculationResults.length === 0 && hasChanges)}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
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
