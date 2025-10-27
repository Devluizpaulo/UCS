'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getCommodityPricesByDate } from '@/lib/data-service';
import type { CommodityPriceData } from '@/lib/types';

/**
 * Componente para testar o sistema de bloqueio de dias úteis
 * Permite selecionar uma data e ver como o sistema responde
 */

export function BusinessDayTest() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [testResult, setTestResult] = useState<CommodityPriceData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await getCommodityPricesByDate(selectedDate);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getTestSummary = () => {
    if (!testResult) return null;

    const blockedCount = testResult.filter(asset => asset.isBlocked).length;
    const totalCount = testResult.length;
    const allBlocked = blockedCount === totalCount;
    const someBlocked = blockedCount > 0;

    return {
      totalCount,
      blockedCount,
      allowedCount: totalCount - blockedCount,
      allBlocked,
      someBlocked,
      blockReason: testResult.find(asset => asset.isBlocked)?.blockReason
    };
  };

  const summary = getTestSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Bloqueio de Dias Úteis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data para testar:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? 'Testando...' : 'Executar Teste'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Erro no teste</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.allBlocked ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : summary.someBlocked ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.totalCount}</div>
                <div className="text-sm text-blue-700">Total de Ativos</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.allowedCount}</div>
                <div className="text-sm text-green-700">Permitidos</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.blockedCount}</div>
                <div className="text-sm text-red-700">Bloqueados</div>
              </div>
            </div>

            {summary.allBlocked && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Todos os dados bloqueados</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Motivo: {summary.blockReason}
                </p>
              </div>
            )}

            {summary.someBlocked && !summary.allBlocked && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Alguns dados bloqueados</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  Motivo: {summary.blockReason}
                </p>
              </div>
            )}

            {!summary.someBlocked && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Todos os dados disponíveis</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Data é um dia útil - cotações normais
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResult.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    asset.isBlocked 
                      ? "bg-red-50 border-red-200" 
                      : "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {asset.isBlocked ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="text-sm">
                    {asset.isBlocked ? (
                      <span className="text-red-600">Bloqueado: {asset.blockReason}</span>
                    ) : (
                      <span className="text-green-600">Disponível</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de teste */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Teste fins de semana:</strong> Selecione um sábado ou domingo</p>
            <p><strong>Teste feriados:</strong> Selecione 25/12/2025 (Natal) ou 01/01/2026 (Ano Novo)</p>
            <p><strong>Teste dia útil:</strong> Selecione uma segunda, terça, quarta, quinta ou sexta-feira normal</p>
            <p><strong>Comportamento esperado:</strong> Fins de semana e feriados devem bloquear todos os dados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para demonstrar diferentes cenários
export function BusinessDayScenarios() {
  const scenarios = [
    {
      name: 'Dia Útil Normal',
      date: new Date(2025, 9, 28), // 28/10/2025 (terça-feira)
      expected: 'Todos os dados disponíveis',
      color: 'green'
    },
    {
      name: 'Fim de Semana',
      date: new Date(2025, 9, 26), // 26/10/2025 (domingo)
      expected: 'Todos os dados bloqueados',
      color: 'red'
    },
    {
      name: 'Feriado Nacional',
      date: new Date(2025, 11, 25), // 25/12/2025 (Natal)
      expected: 'Todos os dados bloqueados',
      color: 'red'
    },
    {
      name: 'Véspera de Feriado',
      date: new Date(2025, 11, 24), // 24/12/2025 (véspera do Natal)
      expected: 'Todos os dados disponíveis',
      color: 'green'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Cenários de Teste</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {scenarios.map((scenario, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                scenario.color === 'green' 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              )}
            >
              <div>
                <div className="font-medium">{scenario.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(scenario.date, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                </div>
              </div>
              <div className={cn(
                "text-sm font-medium",
                scenario.color === 'green' ? "text-green-600" : "text-red-600"
              )}>
                {scenario.expected}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
