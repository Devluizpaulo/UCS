'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UcsIndexChart } from '@/components/ucs-index-chart';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  Leaf,
  DollarSign,
  Calculator,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  calcularUCSCompleto,
  obterValoresPadrao,
  formatarValorMonetario,
  validarCalculosComTabela,
  type UCSCalculationInputs,
  type UCSCalculationResult
} from '@/lib/ucs-pricing-service';
import { getFormulaParameters } from '@/lib/formula-service';
import type { FormulaParameters, ChartData } from '@/lib/types';

interface UCSIndexDisplayProps {
  className?: string;
}

export function UCSIndexDisplay({ className }: UCSIndexDisplayProps) {
  const [ucsValue, setUcsValue] = useState<number>(0);
  const [resultado, setResultado] = useState<UCSCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [previousValue, setPreviousValue] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [validacao, setValidacao] = useState<{
    precisao: number;
    sugestoes: string[];
  } | null>(null);

  const calculateUCSIndex = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obter parâmetros da fórmula configurados
      const formulaParams = await getFormulaParameters();
      
      if (!formulaParams.isConfigured) {
        setError('Parâmetros da fórmula não configurados. Configure em Configurações.');
        return;
      }

      // Obter cotações atuais
      const cotacoes = await obterValoresPadrao();

      // Preparar inputs para o cálculo UCS
      const inputs: UCSCalculationInputs = {
        // Valores da madeira
        fm3: formulaParams.produtividade_madeira,
        pm3mad: cotacoes.pm3mad || 0,
        
        // Produção (dos parâmetros configurados)
        pecuariaProducao: formulaParams.produtividade_boi,
        milhoProducao: formulaParams.produtividade_milho,
        sojaProducao: formulaParams.produtividade_soja,
        
        // Cotações (das fontes de dados)
        pecuariaCotacao: cotacoes.pecuariaCotacao || 0,
        milhoCotacao: cotacoes.milhoCotacao || 0,
        sojaCotacao: cotacoes.sojaCotacao || 0,
        cotacaoCreditoCarbono: cotacoes.cotacaoCreditoCarbono || 0,
        
        // Outros parâmetros
        pibPorHectare: formulaParams.pib_por_hectare,
        carbonoEstocado: formulaParams.produtividade_carbono,
        areaTotal: formulaParams.area_total
      };

      // Calcular UCS
      const resultado = calcularUCSCompleto(inputs);
      
      // Determinar tendência
      const newValue = resultado.unidadeCreditoSustentabilidade;
      if (newValue > previousValue) {
        setTrend('up');
      } else if (newValue < previousValue) {
        setTrend('down');
      } else {
        setTrend('stable');
      }
      
      setPreviousValue(ucsValue);
      setUcsValue(newValue);
      setResultado(resultado);
      setLastUpdate(new Date());
      
      // Adicionar ponto ao gráfico
      const newDataPoint: ChartData = {
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: newValue,
      };
      
      setChartData(prev => {
        const updated = [...prev, newDataPoint];
        // Manter apenas os últimos 20 pontos
        return updated.slice(-20);
      });
      
    } catch (error) {
      console.error('Erro ao calcular índice UCS:', error);
      setError(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular automaticamente na inicialização
  useEffect(() => {
    calculateUCSIndex();
  }, []);

  // Atualizar automaticamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      calculateUCSIndex();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Índice UCS</CardTitle>
          <CardDescription>Unidade de Crédito de Sustentabilidade</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChart(!showChart)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={calculateUCSIndex}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className={`text-2xl font-bold ${getTrendColor()}`}>
                  {loading ? '...' : formatarValorMonetario(ucsValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moeda UCS
                </p>
              </div>
              {resultado && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Composição
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Composição do Índice UCS
                      </DialogTitle>
                      <DialogDescription>
                        Detalhamento completo do cálculo da Unidade de Crédito de Sustentabilidade
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Resultado Final */}
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="text-xl text-green-800">
                            UCS = {formatarValorMonetario(resultado.unidadeCreditoSustentabilidade)}
                          </CardTitle>
                          <CardDescription className="text-green-600">
                            Fórmula: UCS = 2 × IVP
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {/* Componentes Principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">IVP - Índice de Viabilidade</CardTitle>
                            <CardDescription>IVP = (PDM/CE)/2</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {formatarValorMonetario(resultado.indiceViabilidadeProjeto)}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">PDM - Patrimônio Digital</CardTitle>
                            <CardDescription>PDM = VM + VUS + CRS</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {formatarValorMonetario(resultado.potencialDesflorestadorMonetizado)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detalhamento dos Componentes */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Componentes do PDM</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <Leaf className="h-5 w-5 text-green-600 mr-2" />
                                <span className="font-semibold">VM</span>
                              </div>
                              <div className="text-lg font-bold">
                                {formatarValorMonetario(resultado.valorMadeira)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Valor da Madeira
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                                <span className="font-semibold">VUS</span>
                              </div>
                              <div className="text-lg font-bold">
                                {formatarValorMonetario(resultado.valorUsoSolo)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Valor Uso do Solo
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                                <span className="font-semibold">CRS</span>
                              </div>
                              <div className="text-lg font-bold">
                                {formatarValorMonetario(resultado.custoResponsabilidadeSocioambiental)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Custo Socioambiental
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Detalhes VUS */}
                          <div>
                            <h4 className="font-semibold mb-2">Detalhes VUS (Valor de Uso do Solo):</h4>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <Badge variant="secondary">Pecuária (35%)</Badge>
                                <div className="mt-1">{formatarValorMonetario(resultado.detalhes.vus.vboi)}</div>
                              </div>
                              <div>
                                <Badge variant="secondary">Milho (30%)</Badge>
                                <div className="mt-1">{formatarValorMonetario(resultado.detalhes.vus.vmilho)}</div>
                              </div>
                              <div>
                                <Badge variant="secondary">Soja (35%)</Badge>
                                <div className="mt-1">{formatarValorMonetario(resultado.detalhes.vus.vsoja)}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              * Total VUS = (Vboi + Vmilho + Vsoja) × Fator Arrend. (4,8%) × Área Total
                            </div>
                          </div>

                          {/* Detalhes CRS */}
                          <div>
                            <h4 className="font-semibold mb-2">Detalhes CRS (Custo Socioambiental):</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <Badge variant="secondary">Crédito de Carbono (CC)</Badge>
                                <div className="mt-1">{formatarValorMonetario(resultado.detalhes.crs.cc)}</div>
                                <div className="text-xs text-muted-foreground">Preço Carbono × 2.59 tCO2/ha × Área</div>
                              </div>
                              <div>
                                <Badge variant="secondary">Custo da Água (CH2O)</Badge>
                                <div className="mt-1">{formatarValorMonetario(resultado.detalhes.crs.ch2o)}</div>
                                <div className="text-xs text-muted-foreground">PIB/ha × 7% × Área</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {/* Gráfico de Tendência */}
            {showChart && chartData.length > 0 && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <div className="h-[200px]">
                  <UcsIndexChart data={chartData} loading={false} />
                </div>
              </div>
            )}
            
            {lastUpdate && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Última atualização:</span>
                <span>{lastUpdate.toLocaleTimeString('pt-BR')}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
