'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, Info, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { CommodityPriceData } from '@/lib/types';

export interface ValidationAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  assetId?: string;
  assetName?: string;
  currentValue?: number;
  suggestedValue?: number;
  percentageChange?: number;
  canDismiss?: boolean;
}

interface ValidationAlertsProps {
  alerts: ValidationAlert[];
  onDismiss?: (alertId: string) => void;
  onAcceptSuggestion?: (alertId: string, suggestedValue: number) => void;
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
}

function getAlertVariant(type: string): "default" | "destructive" {
  return type === 'error' ? 'destructive' : 'default';
}

function getTrendIcon(percentageChange?: number) {
  if (!percentageChange) return null;
  
  if (percentageChange > 0) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
}

export function ValidationAlerts({ alerts, onDismiss, onAcceptSuggestion }: ValidationAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="relative">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <AlertTitle className="flex items-center gap-2">
                {alert.title}
                {alert.assetName && (
                  <Badge variant="outline" className="text-xs">
                    {alert.assetName}
                  </Badge>
                )}
              </AlertTitle>
              
              <AlertDescription className="mt-2">
                {alert.description}
                
                {/* Informações de Valor */}
                {alert.currentValue !== undefined && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Valor Atual:</span>
                        <div className="font-mono">
                          {formatCurrency(alert.currentValue, 'BRL', alert.assetId || '')}
                        </div>
                      </div>
                      
                      {alert.suggestedValue !== undefined && (
                        <div>
                          <span className="font-medium">Valor Sugerido:</span>
                          <div className="font-mono text-green-700">
                            {formatCurrency(alert.suggestedValue, 'BRL', alert.assetId || '')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {alert.percentageChange !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        {getTrendIcon(alert.percentageChange)}
                        <span className="text-sm font-medium">
                          Variação: {alert.percentageChange > 0 ? '+' : ''}{alert.percentageChange.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
              
              {/* Ações */}
              <div className="mt-3 flex items-center gap-2">
                {alert.suggestedValue !== undefined && onAcceptSuggestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcceptSuggestion(alert.id, alert.suggestedValue)}
                    className="text-xs"
                  >
                    Aceitar Sugestão
                  </Button>
                )}
                
                {alert.canDismiss && onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(alert.id)}
                    className="text-xs"
                  >
                    Dispensar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Botão de Fechar */}
            {alert.canDismiss && onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 right-2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
}

// Função utilitária para gerar alertas de validação
export function generateValidationAlerts(
  assets: CommodityPriceData[],
  editedValues: Record<string, number>,
  historicalData?: Record<string, number[]>
): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];

  for (const asset of assets) {
    const editedValue = editedValues[asset.id];
    if (editedValue === undefined) continue;

    const originalValue = asset.price;
    const percentageChange = ((editedValue - originalValue) / originalValue) * 100;

    // Alerta para mudanças extremas (>50%)
    if (Math.abs(percentageChange) > 50) {
      alerts.push({
        id: `extreme-change-${asset.id}`,
        type: 'warning',
        title: 'Mudança Extrema Detectada',
        description: `O valor de ${asset.name} foi alterado em mais de 50%. Verifique se este valor está correto.`,
        assetId: asset.id,
        assetName: asset.name,
        currentValue: originalValue,
        suggestedValue: editedValue,
        percentageChange,
        canDismiss: true
      });
    }

    // Alerta para valores zero
    if (editedValue === 0) {
      alerts.push({
        id: `zero-value-${asset.id}`,
        type: 'error',
        title: 'Valor Zero Detectado',
        description: `O valor de ${asset.name} foi definido como zero. Isso pode causar problemas nos cálculos dependentes.`,
        assetId: asset.id,
        assetName: asset.name,
        currentValue: originalValue,
        suggestedValue: editedValue,
        canDismiss: false
      });
    }

    // Alerta para valores negativos
    if (editedValue < 0) {
      alerts.push({
        id: `negative-value-${asset.id}`,
        type: 'error',
        title: 'Valor Negativo Detectado',
        description: `O valor de ${asset.name} não pode ser negativo. Por favor, insira um valor válido.`,
        assetId: asset.id,
        assetName: asset.name,
        currentValue: originalValue,
        suggestedValue: Math.abs(editedValue),
        canDismiss: false
      });
    }

    // Alertas baseados em dados históricos
    if (historicalData && historicalData[asset.id]) {
      const historical = historicalData[asset.id];
      const average = historical.reduce((a, b) => a + b, 0) / historical.length;
      const deviation = Math.abs(editedValue - average) / average * 100;

      if (deviation > 30) {
        alerts.push({
          id: `historical-deviation-${asset.id}`,
          type: 'info',
          title: 'Desvio do Histórico',
          description: `O valor de ${asset.name} está ${deviation.toFixed(1)}% distante da média histórica.`,
          assetId: asset.id,
          assetName: asset.name,
          currentValue: editedValue,
          suggestedValue: average,
          percentageChange: ((editedValue - average) / average) * 100,
          canDismiss: true
        });
      }
    }
  }

  return alerts;
}
