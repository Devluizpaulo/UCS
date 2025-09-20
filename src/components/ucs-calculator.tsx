
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import {
  calcularUCSCompleto,
  obterValoresPadrao,
  formatCurrency,
  validarInputsUCS,
  type UCSCalculationInputs,
  type UCSCalculationResult,
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
      const valoresIniciais = await obterValoresPadrao();
      setInputs(valoresIniciais);
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

  const calcular = useCallback(async () => {
    const validacao = validarInputsUCS(inputs);
    
    if (!validacao.valido) {
      setErros(validacao.erros);
      setResultado(null);
      return;
    }

    try {
      const resultadoCalc = await calcularUCSCompleto(inputs as UCSCalculationInputs);
      setResultado(resultadoCalc);
      setErros([]);
    } catch (error) {
      setErros([`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
      setResultado(null);
    }
  }, [inputs]);

  useEffect(() => {
    if (!carregando && Object.keys(inputs).length > 0) {
      calcular();
    }
  }, [inputs, carregando, calcular]);

  const handleInputChange = (field: keyof UCSCalculationInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [field]: numericValue }));
  };

  const renderInputField = (id: keyof UCSCalculationInputs, label: string, isCurrency = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {isCurrency && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>}
        <Input
          id={id}
          type="number"
          step="any"
          value={String(inputs[id] ?? '')}
          onChange={(e) => handleInputChange(id, e.target.value)}
          className={`text-right ${isCurrency ? 'pl-8' : ''}`}
          placeholder="0.00"
          disabled={carregando}
        />
      </div>
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
                <Label className="text-sm text-muted-foreground">UCS Crédito Floresta (CF)</Label>
                <p className="text-4xl font-bold text-primary">{formatCurrency(resultado.ucsCF, 'BRL')}</p>
                 <div className="text-xs text-muted-foreground flex gap-4">
                    <span>{formatCurrency(resultado.ucsCF * (inputs.taxa_usd_brl ? 1/inputs.taxa_usd_brl : 0), 'USD')}</span>
                    <span>{formatCurrency(resultado.ucsCF * (inputs.taxa_eur_brl ? 1/inputs.taxa_eur_brl : 0), 'EUR')}</span>
                 </div>
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label className="text-sm">Índice de Viabilidade (IVP)</Label>
                    <p className="text-lg font-semibold">{resultado.ivp.toFixed(4)}</p>
                </div>
                <div>
                    <Label className="text-sm">Potencial Desflorestador (PDM)</Label>
                    <p className="text-lg font-semibold">{formatCurrency(resultado.pdm, 'BRL')}</p>
                </div>
            </div>

            <Card className="bg-muted/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Detalhamento do PDM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor de Uso da Terra (vUS)</span>
                        <span className="font-medium">{formatCurrency(resultado.vUS, 'BRL')}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor da Madeira (vMAD)</span>
                        <span className="font-medium">{formatCurrency(resultado.vMAD, 'BRL')}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Custo Socioambiental (cRS)</span>
                        <span className="font-medium">{formatCurrency(resultado.cRS, 'BRL')}</span>
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
            <CardDescription>Preços atuais dos ativos que compõem o índice. Os valores são carregados automaticamente mas podem ser alterados para simulações.</CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
                renderInputSkeleton()
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderInputField('preco_boi_brl', 'Preço Boi (@)', true)}
                    {renderInputField('preco_milho_brl_ton', 'Preço Milho (Ton)', true)}
                    {renderInputField('preco_soja_brl_ton', 'Preço Soja (Ton)', true)}
                    {renderInputField('preco_madeira_brl_m3', 'Preço Madeira (m³)', true)}
                    {renderInputField('preco_carbono_brl', 'Preço Carbono (Ton CO₂)', true)}
                    {renderInputField('taxa_usd_brl', 'Taxa Câmbio USD/BRL', false)}
                    {renderInputField('taxa_eur_brl', 'Taxa Câmbio EUR/BRL', false)}
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros Fixos da Fórmula</CardTitle>
            <CardDescription>Ajuste as produtividades e fatores para simular cenários.</CardDescription>
          </CardHeader>
          <CardContent>
             {carregando ? (
                <>
                  {renderInputSkeleton()}
                </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {renderInputField('produtividade_boi', 'Prod. Boi (@/ha)')}
                  {renderInputField('produtividade_milho', 'Prod. Milho (ton/ha)')}
                  {renderInputField('produtividade_soja', 'Prod. Soja (ton/ha)')}
                  {renderInputField('produtividade_madeira', 'Prod. Madeira (m³/ha)')}
                  {renderInputField('fator_arrendamento', 'Fator Arrendamento (%)', false)}
                  {renderInputField('fator_ucs', 'Fator UCS (%)', false)}
                  {renderInputField('produtividade_carbono', 'Média de CE (tCO₂e/ha)')}
                  {renderInputField('fator_pecuaria', 'Ponderação Pecuária (%)')}
                  {renderInputField('fator_milho', 'Ponderação Milho (%)')}
                  {renderInputField('fator_soja', 'Ponderação Soja (%)')}
                  {renderInputField('fator_agua', 'Custo Água (%)')}
                  {renderInputField('FATOR_CARBONO', 'Fator Carbono (CRS)')}
                  {renderInputField('fator_vus_final', 'Fator VUS Final')}
                  {renderInputField('fator_multiplicador_madeira', 'Fator Madeira Final')}
                  {renderInputField('fator_crs_final', 'Fator CRS Final')}
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
            <CardDescription>O valor da UCS é calculado em tempo real com base nos parâmetros inseridos.</CardDescription>
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
