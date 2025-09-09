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

export function UCSCalculator() {
  const [inputs, setInputs] = useState<UCSCalculationInputs>({
    fm3: 150,
    pm3mad: 200,
    pecuariaProducao: 1.5,
    milhoProducao: 8000,
    sojaProducao: 3000,
    pecuariaCotacao: 0,
    milhoCotacao: 0,
    sojaCotacao: 0,
    cotacaoCreditoCarbono: 0,
    pibPorHectare: 50000,
    carbonoEstocado: 100
  });

  const [resultado, setResultado] = useState<UCSCalculationResult | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [carregandoPadrao, setCarregandoPadrao] = useState(false);

  // Carregar valores padrão das cotações
  const carregarValoresPadrao = async () => {
    setCarregandoPadrao(true);
    try {
      const valoresPadrao = await obterValoresPadrao();
      setInputs(prev => ({ ...prev, ...valoresPadrao }));
    } catch (error) {
      console.error('Erro ao carregar valores padrão:', error);
    } finally {
      setCarregandoPadrao(false);
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
      const resultado = calcularUCSCompleto(inputs);
      setResultado(resultado);
      setErros([]);
    } catch (error) {
      setErros([`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
      setResultado(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora UCS - Unidade de Crédito de Sustentabilidade
          </CardTitle>
          <CardDescription>
            Calcule o valor da UCS baseado na metodologia de precificação oficial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={carregarValoresPadrao} 
              variant="outline" 
              size="sm"
              disabled={carregandoPadrao}
            >
              {carregandoPadrao ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Cotações
            </Button>
          </div>

          <Tabs defaultValue="inputs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inputs">Parâmetros de Entrada</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-6">
              {/* Valor da Madeira (VM) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Valor da Madeira (VM)
                  </CardTitle>
                  <CardDescription>
                    VM = Fm3 × Pm3mad
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fm3">Volume de Madeira (m³/ha)</Label>
                    <Input
                      id="fm3"
                      type="number"
                      value={inputs.fm3}
                      onChange={(e) => handleInputChange('fm3', e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pm3mad">Preço da Madeira (R$/m³)</Label>
                    <Input
                      id="pm3mad"
                      type="number"
                      value={inputs.pm3mad}
                      onChange={(e) => handleInputChange('pm3mad', e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Valor de Uso do Solo (VUS) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Valor de Uso do Solo (VUS)
                  </CardTitle>
                  <CardDescription>
                    Baseado na produção e cotação de commodities com fatores de ponderação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pecuária - Produção (cabeças/ha)</Label>
                      <Input
                        type="number"
                        value={inputs.pecuariaProducao}
                        onChange={(e) => handleInputChange('pecuariaProducao', e.target.value)}
                        placeholder="1.5"
                      />
                      <Badge variant="secondary" className="mt-1">Fator: 0,35</Badge>
                    </div>
                    <div>
                      <Label>Pecuária - Cotação (R$/cabeça)</Label>
                      <Input
                        type="number"
                        value={inputs.pecuariaCotacao}
                        onChange={(e) => handleInputChange('pecuariaCotacao', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Milho - Produção (kg/ha)</Label>
                      <Input
                        type="number"
                        value={inputs.milhoProducao}
                        onChange={(e) => handleInputChange('milhoProducao', e.target.value)}
                        placeholder="8000"
                      />
                      <Badge variant="secondary" className="mt-1">Fator: 0,30</Badge>
                    </div>
                    <div>
                      <Label>Milho - Cotação (R$/kg)</Label>
                      <Input
                        type="number"
                        value={inputs.milhoCotacao}
                        onChange={(e) => handleInputChange('milhoCotacao', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Soja - Produção (kg/ha)</Label>
                      <Input
                        type="number"
                        value={inputs.sojaProducao}
                        onChange={(e) => handleInputChange('sojaProducao', e.target.value)}
                        placeholder="3000"
                      />
                      <Badge variant="secondary" className="mt-1">Fator: 0,35</Badge>
                    </div>
                    <div>
                      <Label>Soja - Cotação (R$/kg)</Label>
                      <Input
                        type="number"
                        value={inputs.sojaCotacao}
                        onChange={(e) => handleInputChange('sojaCotacao', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Fator de Arrendamento Médio:</strong> 4,8%
                  </div>
                </CardContent>
              </Card>

              {/* Custo da Responsabilidade Socioambiental (CRS) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Custo da Responsabilidade Socioambiental (CRS)
                  </CardTitle>
                  <CardDescription>
                    CRS = Cc + CH2O (Crédito de Carbono + Custo da Água)
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cotação Crédito de Carbono (R$/tCO2)</Label>
                    <Input
                      type="number"
                      value={inputs.cotacaoCreditoCarbono}
                      onChange={(e) => handleInputChange('cotacaoCreditoCarbono', e.target.value)}
                      placeholder="0"
                    />
                    <Badge variant="secondary" className="mt-1">2,59 tCO2/ha</Badge>
                  </div>
                  <div>
                    <Label>PIB por Hectare (R$/ha)</Label>
                    <Input
                      type="number"
                      value={inputs.pibPorHectare}
                      onChange={(e) => handleInputChange('pibPorHectare', e.target.value)}
                      placeholder="50000"
                    />
                    <Badge variant="secondary" className="mt-1">Fator água: 7%</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Carbono Estocado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Carbono Estocado (CE)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Carbono Estocado (tCO2 eq/ha)</Label>
                    <Input
                      type="number"
                      value={inputs.carbonoEstocado}
                      onChange={(e) => handleInputChange('carbonoEstocado', e.target.value)}
                      placeholder="100"
                    />
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
                            <strong>Pecuária:</strong> {formatarValorMonetario(resultado.detalhes.vus.pecuaria.valor)}
                          </div>
                          <div>
                            <strong>Milho:</strong> {formatarValorMonetario(resultado.detalhes.vus.milho.valor)}
                          </div>
                          <div>
                            <strong>Soja:</strong> {formatarValorMonetario(resultado.detalhes.vus.soja.valor)}
                          </div>
                        </div>
                      </div>

                      {/* Detalhes CRS */}
                      <div>
                        <Label className="font-semibold mb-2 block">Detalhes CRS:</Label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>Crédito de Carbono:</strong> {formatarValorMonetario(resultado.detalhes.crs.creditoCarbono.valor)}
                          </div>
                          <div>
                            <strong>Custo da Água:</strong> {formatarValorMonetario(resultado.detalhes.crs.custoAgua.valor)}
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