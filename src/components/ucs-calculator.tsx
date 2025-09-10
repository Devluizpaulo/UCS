
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, Leaf, DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import {
  calcularUCSCompleto,
  obterValoresPadrao,
  formatarValorMonetario,
  validarInputsUCS,
  type UCSCalculationInputs,
  type UCSCalculationResult
} from '@/lib/ucs-pricing-service';
import { getFormulaParameters } from '@/lib/formula-service';
import type { FormulaParameters } from '@/lib/types';


export function UCSCalculator() {
  const [inputs, setInputs] = useState<Partial<UCSCalculationInputs>>({});
  const [resultado, setResultado] = useState<UCSCalculationResult | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Carregar valores padrão das cotações e parâmetros
  const carregarValoresPadrao = async () => {
    setCarregando(true);
    try {
      const [cotacoes, params] = await Promise.all([
        obterValoresPadrao(),
        getFormulaParameters(),
      ]);
      setInputs({ ...params, ...cotacoes });
    } catch (error) {
      console.error('Erro ao carregar valores padrão:', error);
      setErros(['Falha ao carregar dados iniciais.']);
    } finally {
      setCarregando(false);
    }
  };

  // Carregar valores padrão na inicialização
  useEffect(() => {
    carregarValoresPadrao();
  }, []);

  const handleInputChange = (field: keyof UCSCalculationInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numericValue }));
  };

  const calcular = () => {
    const validacao = validarInputsUCS(inputs);
    
    if (!validacao.valido) {
      setErros(validacao.erros);
      setResultado(null);
      return;
    }

    try {
      const resultado = calcularUCSCompleto(inputs as UCSCalculationInputs);
      setResultado(resultado);
      setErros([]);
    } catch (error) {
      setErros([`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
      setResultado(null);
    }
  };

  if (carregando) {
    return (
        <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando calculadora...
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora UCS - Unidade de Crédito de Sustentabilidade
          </CardTitle>
          <CardDescription>
            Calcule o valor da UCS baseado na metodologia de precificação oficial, ajustando os parâmetros abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={carregarValoresPadrao} 
              variant="outline" 
              size="sm"
              disabled={carregando}
            >
              {carregando ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recarregar Padrões
            </Button>
          </div>

          <Tabs defaultValue="inputs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inputs">Parâmetros de Entrada</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-6 mt-4">
              
              {/* Cotações */}
              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Cotações das Commodities</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="pm3mad">Preço Madeira (R$/m³)</Label>
                        <Input id="pm3mad" type="number" value={inputs.pm3mad || 0} onChange={(e) => handleInputChange('pm3mad', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="pecuariaCotacao">Preço Boi (@)</Label>
                        <Input id="pecuariaCotacao" type="number" value={inputs.pecuariaCotacao || 0} onChange={(e) => handleInputChange('pecuariaCotacao', e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="milhoCotacao">Preço Milho (ton)</Label>
                        <Input id="milhoCotacao" type="number" value={inputs.milhoCotacao || 0} onChange={(e) => handleInputChange('milhoCotacao', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="sojaCotacao">Preço Soja (ton)</Label>
                        <Input id="sojaCotacao" type="number" value={inputs.sojaCotacao || 0} onChange={(e) => handleInputChange('sojaCotacao', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="cotacaoCreditoCarbono">Preço Carbono (R$/tCO2)</Label>
                        <Input id="cotacaoCreditoCarbono" type="number" value={inputs.cotacaoCreditoCarbono || 0} onChange={(e) => handleInputChange('cotacaoCreditoCarbono', e.target.value)} />
                    </div>
                </CardContent>
              </Card>

              {/* Parâmetros da Fórmula */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Parâmetros da Fórmula
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="produtividade_madeira">Prod. Madeira (m³/ha)</Label>
                    <Input id="produtividade_madeira" type="number" value={inputs.produtividade_madeira || 0} onChange={(e) => handleInputChange('produtividade_madeira', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="produtividade_boi">Prod. Boi (@/ha)</Label>
                    <Input id="produtividade_boi" type="number" value={inputs.produtividade_boi || 0} onChange={(e) => handleInputChange('produtividade_boi', e.target.value)} />
                  </div>
                   <div>
                    <Label htmlFor="produtividade_milho">Prod. Milho (ton/ha)</Label>
                    <Input id="produtividade_milho" type="number" value={inputs.produtividade_milho || 0} onChange={(e) => handleInputChange('produtividade_milho', e.target.value)} />
                  </div>
                   <div>
                    <Label htmlFor="produtividade_soja">Prod. Soja (ton/ha)</Label>
                    <Input id="produtividade_soja" type="number" value={inputs.produtividade_soja || 0} onChange={(e) => handleInputChange('produtividade_soja', e.target.value)} />
                  </div>
                   <div>
                    <Label htmlFor="produtividade_carbono">Prod. Carbono (tCO2e/ha)</Label>
                    <Input id="produtividade_carbono" type="number" value={inputs.produtividade_carbono || 0} onChange={(e) => handleInputChange('produtividade_carbono', e.target.value)} />
                  </div>
                   <div>
                    <Label htmlFor="pib_por_hectare">PIB por Hectare (R$)</Label>
                    <Input id="pib_por_hectare" type="number" value={inputs.pib_por_hectare || 0} onChange={(e) => handleInputChange('pib_por_hectare', e.target.value)} />
                  </div>
                   <div>
                    <Label htmlFor="area_total">Área Total (ha)</Label>
                    <Input id="area_total" type="number" value={inputs.area_total || 0} onChange={(e) => handleInputChange('area_total', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={calcular} className="w-full" size="lg">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular UCS
              </Button>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {erros.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {erros.map((erro, index) => (
                        <li key={index}>{erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {resultado && (
                <div className="space-y-4">
                  {/* Resultado Final */}
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-2xl text-green-800">
                        UCS (CF) = {formatarValorMonetario(resultado.unidadeCreditoSustentabilidade)}
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Unidade de Crédito de Sustentabilidade - Crédito de Floresta
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Componentes do Cálculo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">IVP - Índice de Viabilidade</CardTitle>
                        <CardDescription>IVP = (PDM/CE)/2</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarValorMonetario(resultado.indiceViabilidadeProjeto)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">PDM - Potencial Desflorestador</CardTitle>
                        <CardDescription>PDM = VM + VUS + CRS</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatarValorMonetario(resultado.potencialDesflorestadorMonetizado)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detalhamento dos Componentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhamento dos Componentes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="font-semibold">Valor da Madeira (VM)</Label>
                          <div className="text-lg">{formatarValorMonetario(resultado.valorMadeira)}</div>
                          <div className="text-sm text-muted-foreground">
                            {resultado.detalhes.vm.fm3} m³ × {formatarValorMonetario(resultado.detalhes.vm.pm3mad)}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Valor Uso do Solo (VUS)</Label>
                          <div className="text-lg">{formatarValorMonetario(resultado.valorUsoSolo)}</div>
                          <div className="text-sm text-muted-foreground">
                            Com fator arrendamento 4,8%
                          </div>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Custo Resp. Socioambiental (CRS)</Label>
                          <div className="text-lg">{formatarValorMonetario(resultado.custoResponsabilidadeSocioambiental)}</div>
                          <div className="text-sm text-muted-foreground">
                            Carbono + Água
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Detalhes VUS */}
                      <div>
                        <Label className="font-semibold mb-2 block">Detalhes VUS:</Label>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <strong>Pecuária:</strong> {formatarValorMonetario(resultado.detalhes.vus.vboi)}
                          </div>
                          <div>
                            <strong>Milho:</strong> {formatarValorMonetario(resultado.detalhes.vus.vmilho)}
                          </div>
                          <div>
                            <strong>Soja:</strong> {formatarValorMonetario(resultado.detalhes.vus.vsoja)}
                          </div>
                        </div>
                      </div>

                      {/* Detalhes CRS */}
                      <div>
                        <Label className="font-semibold mb-2 block">Detalhes CRS:</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>Crédito de Carbono:</strong> {formatarValorMonetario(resultado.detalhes.crs.cc)}
                          </div>
                          <div>
                            <strong>Custo da Água:</strong> {formatarValorMonetario(resultado.detalhes.crs.ch2o)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
