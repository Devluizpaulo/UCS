'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, RefreshCw, AlertCircle, Database, Calculator, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecalculationStep {
  id: string;
  name: string;
  type: 'validation' | 'base_calculation' | 'index_calculation' | 'n8n_trigger' | 'cache_update';
  description: string;
  dependsOn: string[];
  formula?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  duration?: number;
  n8nWebhook?: string;
}

interface RecalculationProgressProps {
  isVisible: boolean;
  steps: RecalculationStep[];
  currentStep?: string;
  progress: number;
  estimatedTimeRemaining?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

function getStatusIcon(step: RecalculationStep) {
  if (step.status === 'completed') {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  if (step.status === 'in_progress') {
    return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
  }
  if (step.status === 'error') {
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  }

  // Ícones por tipo quando pendente
  switch (step.type) {
    case 'validation':
      return <CheckCircle className="h-4 w-4 text-gray-400" />;
    case 'base_calculation':
      return <Database className="h-4 w-4 text-gray-400" />;
    case 'index_calculation':
      return <Calculator className="h-4 w-4 text-gray-400" />;
    case 'n8n_trigger':
      return <Zap className="h-4 w-4 text-gray-400" />;
    case 'cache_update':
      return <RefreshCw className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadge(step: RecalculationStep) {
  switch (step.status) {
    case 'completed':
      return (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">
            Concluído
          </Badge>
          {step.duration && (
            <span className="text-xs text-gray-500">
              {step.duration}ms
            </span>
          )}
        </div>
      );
    case 'in_progress':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Em Progresso</Badge>;
    case 'error':
      return <Badge variant="destructive">Erro</Badge>;
    default:
      return <Badge variant="secondary">Pendente</Badge>;
  }
}

function getTypeLabel(type: RecalculationStep['type']) {
  switch (type) {
    case 'validation':
      return 'Validação';
    case 'base_calculation':
      return 'Cálculo Base';
    case 'index_calculation':
      return 'Índice';
    case 'n8n_trigger':
      return 'N8N Sync';
    case 'cache_update':
      return 'Cache';
    default:
      return 'Processamento';
  }
}

export function RecalculationProgress({ 
  isVisible, 
  steps, 
  currentStep, 
  progress, 
  estimatedTimeRemaining = 0,
  onComplete,
  onCancel 
}: RecalculationProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(0);
    }
  }, [progress, isVisible]);

  useEffect(() => {
    if (progress === 100 && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!isVisible) {
    return null;
  }

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const hasErrors = steps.some(s => s.status === 'error');

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {hasErrors ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : progress === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              )}
              Recálculo Automático com Integração N8N
            </CardTitle>
            <CardDescription>
              Processando alterações e recalculando índices dependentes...
            </CardDescription>
          </div>
          {onCancel && progress < 100 && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso Principal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral ({completedSteps}/{totalSteps})</span>
            <div className="flex items-center gap-2">
              <span>{Math.round(animatedProgress)}%</span>
              {estimatedTimeRemaining > 0 && (
                <span className="text-gray-500">
                  • ~{Math.ceil(estimatedTimeRemaining / 1000)}s restantes
                </span>
              )}
            </div>
          </div>
          <Progress 
            value={animatedProgress} 
            className={`h-2 ${hasErrors ? 'bg-red-100' : ''}`}
          />
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
                step.id === currentStep && "bg-blue-100 border-blue-300 shadow-sm",
                step.status === 'completed' && "bg-green-50 border-green-200",
                step.status === 'error' && "bg-red-50 border-red-200",
                step.status === 'pending' && "bg-white border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 w-6 text-center">
                  {index + 1}
                </span>
                {getStatusIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium truncate">{step.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(step.type)}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-1">
                  {step.description}
                </div>
                
                {step.formula && (
                  <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                    {step.formula}
                  </div>
                )}
                
                {step.dependsOn.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Depende de: {step.dependsOn.join(', ')}
                  </div>
                )}
                
                {step.n8nWebhook && (
                  <div className="text-xs text-blue-600 mt-1">
                    🔗 Webhook N8N: {step.n8nWebhook}
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {getStatusBadge(step)}
              </div>
            </div>
          ))}
        </div>

        {/* Resumo Final */}
        {progress === 100 && (
          <div className={`p-3 rounded-lg ${hasErrors ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2">
              {hasErrors ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className={`font-medium ${hasErrors ? 'text-red-800' : 'text-green-800'}`}>
                {hasErrors ? 'Recálculo concluído com erros' : 'Recálculo concluído com sucesso!'}
              </span>
            </div>
            
            {!hasErrors && (
              <div className="text-sm text-green-700 mt-1">
                Todos os ativos dependentes foram atualizados automaticamente.
                {steps.some(s => s.type === 'n8n_trigger' && s.status === 'completed') && (
                  <span className="block">✅ Integração N8N sincronizada com sucesso.</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Função utilitária para criar etapas de recálculo
export function createRecalculationSteps(editedAssets: string[]): RecalculationStep[] {
  const steps: RecalculationStep[] = [
    {
      id: 'validate',
      name: 'Validação de Dados',
      description: 'Verificando consistência dos valores editados',
      status: 'pending'
    },
    {
      id: 'backup',
      name: 'Backup de Segurança',
      description: 'Criando backup dos valores atuais',
      status: 'pending'
    },
    {
      id: 'rent_media',
      name: 'Rentabilidades Médias',
      description: 'Calculando rentabilidades médias dos ativos base',
      status: 'pending',
      dependencies: ['validate', 'backup']
    },
    {
      id: 'indices_composition',
      name: 'Índices de Composição',
      description: 'Recalculando VUS, VMAD e CRS',
      status: 'pending',
      dependencies: ['rent_media']
    },
    {
      id: 'valor_uso_solo',
      name: 'Valor de Uso do Solo',
      description: 'Calculando índice agregador principal',
      status: 'pending',
      dependencies: ['indices_composition']
    },
    {
      id: 'final_indices',
      name: 'Índices Finais',
      description: 'Calculando PDM, UCS e UCS ASE',
      status: 'pending',
      dependencies: ['valor_uso_solo']
    },
    {
      id: 'persist',
      name: 'Persistência',
      description: 'Salvando dados no banco de dados',
      status: 'pending',
      dependencies: ['final_indices']
    },
    {
      id: 'audit_log',
      name: 'Log de Auditoria',
      description: 'Registrando alterações no histórico',
      status: 'pending',
      dependencies: ['persist']
    }
  ];

  return steps;
}
