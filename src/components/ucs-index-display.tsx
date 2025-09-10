
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { getUcsIndexValue } from '@/lib/data-service';

interface UCSIndexDisplayProps {
  className?: string;
  selectedDate?: string; // YYYY-MM-DD
}

export function UCSIndexDisplay({ className, selectedDate }: UCSIndexDisplayProps) {
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

  const calculateUCSIndex = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const formulaParams = await getFormulaParameters();
      
      if (!formulaParams.isConfigured) {
        setError('Parâmetros da fórmula não configurados. Configure em Configurações.');
        setUcsValue(0);
        setResultado(null);
        setLoading(false);
        return;
      }

      const cotacoes = await obterValoresPadrao(date);

      const inputs: UCSCalculationInputs = { ...cotacoes, ...formulaParams };

      const resultadoCalculado = calcularUCSCompleto(inputs);
      const newValue = resultadoCalculado.unidadeCreditoSustentabilidade;

      setUcsValue(newValue);
      setResultado(resultadoCalculado);
      setLastUpdate(new Date());

      const indexHistory = await getUcsIndexValue('1d', date);
      if (indexHistory.history.length > 1) {
          const latest = indexHistory.history[indexHistory.history.length - 1].value;
          const prev = indexHistory.history[indexHistory.history.length - 2].value;
          if (latest > prev) setTrend('up');
          else if (latest < prev) setTrend('down');
          else setTrend('stable');
      }

      const newDataPoint: ChartData = {
        time: date ? new Date(date).toLocaleDateString('pt-BR') : new Date().toLocaleTimeString('pt-BR'),
        value: newValue,
      };
       setChartData(prev => [...prev.slice(-19), newDataPoint]);
      
    } catch (error) {
      console.error('Erro ao calcular índice UCS:', error);
      setError(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateUCSIndex(selectedDate);
  }, [selectedDate, calculateUCSIndex]);

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
            onClick={() => calculateUCSIndex(selectedDate)}
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
