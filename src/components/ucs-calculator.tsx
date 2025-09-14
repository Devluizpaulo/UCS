
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, Leaf, DollarSign, TrendingUp, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import {
  calcularUCSCompleto,
  obterValoresPadrao,
  formatarValorMonetario,
  validarInputsUCS,
  type UCSCalculationInputs,
  type UCSCalculationResult
} from '@/lib/ucs-pricing-service';
import { Skeleton } from './ui/skeleton';

export function UCSCalculator() {
  const [inputs, setInputs] = useState<Partial<UCSCalculationInputs>>({});
  const [resultado, setResultado] = useState<UCSCalculationResult | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarValoresPadrao = useCallback(async () => {
    setCarregando(true);
    setErros([]);
    try {
      const [cotacoes] = await Promise.all([
        obterValoresPadrao(),
      ]);
      setInputs({ ...cotacoes });
    } catch (error) {
      console.error('Erro ao carregar valores padrão:', error);
      setErros(['Falha ao carregar dados iniciais.']);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarValoresPadrao();
  }, [carregarValoresPadrao]);

  const calcular = useCallback(() => {
    const validacao = validarInputsUCS(inputs);
    
    if (!validacao.valido) {
      setErros(validacao.erros);
      setResultado(null);
      return;
    }

    try {
      const resultadoCalc = calcularUCSCompleto(inputs as UCSCalculationInputs);
      setResultado(resultadoCalc);
      setErros([]);
    } catch (error) {
      setErros([`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
      setResultado(null);
    }
  }, [inputs]);

  useEffect(() => {
    if (!carregando) {
      calcular();
    }
  }, [inputs, carregando, calcular]);

  const handleInputChange = (field: keyof UCSCalculationInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [field]: numericValue }));
  };

  const renderInputField = (id: keyof UCSCalculationInputs, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={inputs[id] || ''}
        onChange={(e) => handleInputChange(id, e.target.value)}
        className="text-right"
        placeholder="0.00"
        disabled={carregando}
      />
    </div>
  );

  const renderResultSection = () => {
    if (erros.length > 0) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erros de Validação</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {erros.map((erro, index) => <li key={index}>{erro}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      );
    }

    if (!resultado) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Aguardando parâmetros para calcular...
        </div>
      );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <Label className="text-sm text-muted-foreground">Valor Final da Unidade de Crédito</Label>
                <p className="text-4xl font-bold text-primary">{formatarValorMonetario(resultado.unidadeCreditoSustentabilidade)}</p>
                <p className="text-xs text-muted-foreground">UCS (CF) - Crédito de Floresta</p>
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label className="text-sm">Índice de Viabilidade (IVP)</Label>
                    <p className="text-lg font-semibold">{formatarValorMonetario(resultado.indiceViabilidadeProjeto)}</p>
                </div>
                <div>
                    <Label className="text-sm">Potencial Desflorestador (PDM)</Label>
                    <p className="text-lg font-semibold">{formatarValorMonetario(resultado.potencialDesflorestadorMonetizado)}</p>
                </div>
            </div>

            <Card className="bg-muted/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Detalhamento dos Componentes do PDM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor da Madeira (VMAD)</span>
                        <span className="font-medium">{formatarValorMonetario(resultado.valorMadeira)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor de Uso do Solo (VUS)</span>
                        <span className="font-medium">{formatarValorMonetario(resultado.valorUsoSolo)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Custo Socioambiental (CRS)</span>
                        <span className="font-medium">{formatarValorMonetario(resultado.custoResponsabilidadeSocioambiental)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  };
  
   const renderInputSkeleton = () => (
     <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
     </div>
   );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      
      {/* Coluna de Inputs */}
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Cotação</CardTitle>
            <CardDescription>Preços atuais dos ativos que compõem o índice.</CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
                renderInputSkeleton()
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderInputField('pm3mad', 'Preço Madeira (R$/m³)')}
                    {renderInputField('pecuariaCotacao', 'Preço Boi (@)')}
                    {renderInputField('milhoCotacao', 'Preço Milho (ton)')}
                    {renderInputField('sojaCotacao', 'Preço Soja (ton)')}
                    {renderInputField('cotacaoCreditoCarbono', 'Preço Carbono (R$/tCO2)')}
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros da Fórmula</CardTitle>
            <CardDescription>Ajuste as produtividades e fatores para simular cenários.</CardDescription>
          </CardHeader>
          <CardContent>
             {carregando ? (
                <>
                  {renderInputSkeleton()}
                  {renderInputSkeleton()}
                </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {renderInputField('produtividade_madeira', 'Prod. Madeira (m³/ha)')}
                  {renderInputField('produtividade_boi', 'Prod. Boi (@/ha)')}
                  {renderInputField('produtividade_milho', 'Prod. Milho (ton/ha)')}
                  {renderInputField('produtividade_soja', 'Prod. Soja (ton/ha)')}
                  {renderInputField('produtividade_carbono', 'Prod. Carbono (tCO2e/ha)')}
                  {renderInputField('pib_por_hectare', 'PIB por Hectare (R$)')}
                  {renderInputField('area_total', 'Área Total (ha)')}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
            <Button onClick={calcular} size="lg" className="flex-1" disabled={carregando}>
                <Calculator className="h-4 w-4 mr-2" />
                {carregando ? 'Carregando...' : 'Calcular / Recalcular'}
            </Button>
            <Button onClick={carregarValoresPadrao} variant="outline" size="lg" disabled={carregando}>
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            </Button>
        </div>

      </div>

      {/* Coluna de Resultados */}
      <div className="lg:col-span-2">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resultado do Cálculo</CardTitle>
            <CardDescription>O valor da UCS é calculado em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {carregando ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : renderResultSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    