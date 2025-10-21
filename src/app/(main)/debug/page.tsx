'use client';

import { useState, useEffect } from 'react';
import { debugFirestoreData, checkCompositionData, createTestCompositionData } from '@/lib/data-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Calendar, BarChart3, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [compositionData, setCompositionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const [targetDate] = useState(new Date('2025-10-21'));

  const runDebug = async () => {
    setIsLoading(true);
    try {
      const data = await debugFirestoreData();
      setDebugData(data);
    } catch (error) {
      console.error('Erro no debug:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkComposition = async () => {
    setIsLoading(true);
    try {
      const data = await checkCompositionData(targetDate);
      setCompositionData(data);
    } catch (error) {
      console.error('Erro ao verificar composition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestData = async () => {
    setIsCreatingTestData(true);
    try {
      const result = await createTestCompositionData(targetDate);
      if (result.success) {
        alert('Dados de teste criados com sucesso!');
        // Recarregar dados
        await checkComposition();
      } else {
        alert(`Erro ao criar dados de teste: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      alert('Erro ao criar dados de teste');
    } finally {
      setIsCreatingTestData(false);
    }
  };

  useEffect(() => {
    runDebug();
    checkComposition();
  }, [targetDate]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Verificação específica para Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Verificação da Página de Composition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Verificando dados para: <strong>{format(targetDate, 'dd/MM/yyyy')}</strong>
            </p>
            <div className="flex gap-2">
              <Button onClick={checkComposition} disabled={isLoading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Verificar Composition
              </Button>
              <Button onClick={createTestData} disabled={isCreatingTestData} variant="default">
                <Plus className={`h-4 w-4 mr-2 ${isCreatingTestData ? 'animate-spin' : ''}`} />
                Criar Dados de Teste
              </Button>
            </div>
          </div>

          {compositionData && (
            <div className="space-y-4">
              {/* Status das coleções */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={compositionData.valor_uso_solo ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {compositionData.valor_uso_solo ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                      <div>
                        <p className="text-sm font-medium">valor_uso_solo</p>
                        <p className="text-xs text-muted-foreground">
                          {compositionData.valor_uso_solo ? 
                            `Valor: ${compositionData.valor_uso_solo.valor}` : 
                            'Sem dados'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={compositionData.PDM ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {compositionData.PDM ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                      <div>
                        <p className="text-sm font-medium">PDM</p>
                        <p className="text-xs text-muted-foreground">
                          {compositionData.PDM ? 
                            `Valor: ${compositionData.PDM.valor}` : 
                            'Sem dados'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={compositionData.ucs_ase ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      {compositionData.ucs_ase ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                      <div>
                        <p className="text-sm font-medium">ucs_ase</p>
                        <p className="text-xs text-muted-foreground">
                          {compositionData.ucs_ase ? 
                            `Valor: ${compositionData.ucs_ase.valor}` : 
                            'Sem dados'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações */}
              {compositionData.recommendations.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendações:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {compositionData.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes dos dados */}
              <details>
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  Ver detalhes dos dados encontrados
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(compositionData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug geral do Firestore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Debug Geral do Firestore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebug} disabled={isLoading} className="mb-4">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Executar Debug Geral
          </Button>

          {debugData && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Coleções</p>
                        <p className="text-2xl font-bold">{debugData.collections.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Registros</p>
                        <p className="text-2xl font-bold">
                          {Object.values(debugData.dateRange).reduce((sum: number, item: any) => sum + item.count, 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Coleções com Dados</p>
                        <p className="text-2xl font-bold">
                          {Object.values(debugData.dateRange).filter((item: any) => item.count > 0).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Coleções */}
              <Card>
                <CardHeader>
                  <CardTitle>Coleções Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {debugData.collections.map((collection: string) => {
                      const range = debugData.dateRange[collection];
                      const sample = debugData.sampleData[collection];
                      
                      return (
                        <div key={collection} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{collection}</h3>
                            <span className="text-sm text-muted-foreground">
                              {range.count} registros
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Data mais antiga:</p>
                              <p className="font-mono">{range.earliest}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Data mais recente:</p>
                              <p className="font-mono">{range.latest}</p>
                            </div>
                          </div>

                          {sample.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Campos disponíveis:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.keys(sample[0]).map((field) => (
                                  <span key={field} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {sample.length > 0 && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                Ver dados de exemplo
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                                {JSON.stringify(sample[0], null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Dados brutos */}
              <details>
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  Ver dados brutos completos
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}